/* global tinymce */
/* eslint consistent-this: [ "error", "control" ] */
wp.textWidgets = ( function( $ ) {
	'use strict';

	var component = {};

	/**
	 * Text widget control.
	 *
	 * @class TextWidgetControl
	 * @constructor
	 * @abstract
	 */
	component.TextWidgetControl = Backbone.View.extend({

		/**
		 * View events.
		 *
		 * @type {Object}
		 */
		events: {},

		/**
		 * Initialize.
		 *
		 * @param {Object}         options - Options.
		 * @param {Backbone.Model} options.model - Model.
		 * @param {jQuery}         options.el - Control container element.
		 * @returns {void}
		 */
		initialize: function initialize( options ) {
			var control = this;

			Backbone.View.prototype.initialize.call( control, options );

			if ( ! control.el ) {
				throw new Error( 'Missing options.el' );
			}
		},

		/**
		 * Render template.
		 *
		 * @returns {void}
		 */
		render: function render() {
			var control = this, changeDebounceDelay = 1000, id, editor, textarea;
			textarea = control.$el.find( 'textarea:first' );
			id = textarea.attr( 'id' );

			// Destroy any existing editor so that it can be re-initialized after a widget-updated event.
			if ( tinymce.get( id ) ) {
				delete tinymce.editors[ id ];
				tinymce.remove( '#' + id );
			}

			wp.editor.initialize( id, {
				tinymce: {
					wpautop: true
				},
				quicktags: true
			} );

			editor = window.tinymce.get( id );
			editor.on( 'change', _.debounce( function() {
				editor.save();
				textarea.trigger( 'change' );
			}, changeDebounceDelay ) );
		}
	});

	/**
	 * Mapping of widget ID to instances of TextWidgetControl subclasses.
	 *
	 * @type {Object.<string, wp.textWidgets.TextWidgetControl>}
	 */
	component.widgetControls = {};

	/**
	 * Handle widget being added or initialized for the first time at the widget-added event.
	 *
	 * @param {jQuery.Event} event - Event.
	 * @param {jQuery}       widgetContainer - Widget container element.
	 * @returns {void}
	 */
	component.handleWidgetAdded = function handleWidgetAdded( event, widgetContainer ) {
		var widgetContent, widgetForm, idBase, widgetControl, widgetId;
		widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' ); // Note: '.form' appears in the customizer, whereas 'form' on the widgets admin screen.
		widgetContent = widgetForm.find( '> .widget-content' );

		idBase = widgetForm.find( '> .id_base' ).val();
		if ( 'text' !== idBase ) {
			return;
		}

		widgetId = widgetForm.find( '> .widget-id' ).val();

		// @todo Obtain the Save/Apply button and detatch the TinyMCE container element upon clicking, to then restore upon widgetUpdated.

		// Prevent initializing already-added widgets.
		if ( component.widgetControls[ widgetId ] ) {
			return;
		}

		widgetControl = new component.TextWidgetControl({
			el: widgetContent
		});

		widgetControl.render();

		component.widgetControls[ widgetId ] = widgetControl;
	};

	/**
	 * Sync widget instance data sanitized from server back onto widget model.
	 *
	 * This gets called via the 'widget-updated' event when saving a widget from
	 * the widgets admin screen and also via the 'widget-synced' event when making
	 * a change to a widget in the customizer.
	 *
	 * @param {jQuery.Event} event - Event.
	 * @param {jQuery}       widgetContainer - Widget container element.
	 * @returns {void}
	 */
	component.handleWidgetUpdated = function handleWidgetUpdated( event, widgetContainer ) {
		var widgetForm, widgetId, widgetControl, idBase;
		widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' );

		idBase = widgetForm.find( '> .id_base' ).val();
		if ( 'text' !== idBase ) {
			return;
		}

		widgetId = widgetForm.find( '> .widget-id' ).val();
		widgetControl = component.widgetControls[ widgetId ];
		if ( ! widgetControl ) {
			return;
		}

		// @todo Try to re-use previous TinyMCE editor that got destroyed with the update? Sync updated textarea?
		widgetControl.render();
	};

	/**
	 * Initialize functionality.
	 *
	 * This function exists to prevent the JS file from having to boot itself.
	 * When WordPress enqueues this script, it should have an inline script
	 * attached which calls wp.textWidgets.init().
	 *
	 * @returns {void}
	 */
	component.init = function init() {
		var $document = $( document );
		$document.on( 'widget-added', component.handleWidgetAdded );
		$document.on( 'widget-updated', component.handleWidgetUpdated );

		/*
		 * Manually trigger widget-added events for media widgets on the admin
		 * screen once they are expanded. The widget-added event is not triggered
		 * for each pre-existing widget on the widgets admin screen like it is
		 * on the customizer. Likewise, the customizer only triggers widget-added
		 * when the widget is expanded to just-in-time construct the widget form
		 * when it is actually going to be displayed. So the following implements
		 * the same for the widgets admin screen, to invoke the widget-added
		 * handler when a pre-existing media widget is expanded.
		 */
		$( function initializeExistingWidgetContainers() {
			var widgetContainers;
			if ( 'widgets' !== window.pagenow ) {
				return;
			}
			widgetContainers = $( '.widgets-holder-wrap:not(#available-widgets)' ).find( 'div.widget' );
			widgetContainers.one( 'click.toggle-widget-expanded', function toggleWidgetExpanded() {
				var widgetContainer = $( this );
				component.handleWidgetAdded( new jQuery.Event( 'widget-added' ), widgetContainer );
			});
		});
	};

	return component;
})( jQuery );
