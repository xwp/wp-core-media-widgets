/* global tinymce, QTags */
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
			var control = this, changeDebounceDelay = 1000, iframeKeepAliveInterval = 1000, id, textarea;
			textarea = control.$el.find( 'textarea:first' );
			id = textarea.attr( 'id' );

			/**
			 * Build (or re-build) an the visual editor.
			 *
			 * @returns {void}
			 */
			function buildEditor() {
				var editor, wrap, onChanged, dirty, triggerChangeIfDirty;

				// Destroy any existing editor so that it can be re-initialized after a widget-updated event.
				if ( tinymce.get( id ) ) {
					delete tinymce.editors[ id ];
					tinymce.remove( '#' + id );
				}

				// Remove any previous QuickTags created in the previous render.
				if ( QTags.instances[ id ] ) {
					delete QTags.instances[ id ];
				}

				// Unwrap the textarea to its original location in the DOM.
				wrap = $( '#wp-' + id + '-wrap' );
				if ( wrap.length ) {
					textarea.show();
					wrap.replaceWith( textarea );
				}

				wp.editor.initialize( id, {
					tinymce: {
						wpautop: true
					},
					quicktags: true
				} );
				QTags._buttonsInit(); // @todo Remove once <https://core.trac.wordpress.org/ticket/35760#comment:28> is resolved.

				editor = window.tinymce.get( id );
				if ( editor.initialized ) {
					watchForDestroyedBody( control.$el.find( 'iframe' )[0] );
				} else {
					editor.on( 'init', function() {
						watchForDestroyedBody( control.$el.find( 'iframe' )[0] );
					} );
				}

				dirty = false;
				onChanged = function() {
					dirty = true;
				};
				triggerChangeIfDirty = function() {
					if ( dirty ) {
						editor.save();
						textarea.trigger( 'change' );
						dirty = false;
					}
				};
				editor.on( 'focus', function() {
					editor.on( 'change', onChanged );
				} );
				editor.on( 'change', _.debounce( triggerChangeIfDirty, changeDebounceDelay ) );
				editor.on( 'blur', function() {
					editor.off( 'change', onChanged );
					triggerChangeIfDirty();
				} );
			}

			/**
			 * Watch an iframe for the destruction of its TinyMCE contenteditable contents.
			 *
			 * @todo There may be a better way to listen for an iframe being destroyed.
			 * @param {HTMLIFrameElement} iframe - TinyMCE iframe.
			 * @returns {void}
			 */
			function watchForDestroyedBody( iframe ) {
				var timeoutId = setInterval( function() {
					if ( ! iframe.contentWindow || iframe.contentWindow.document.body.id ) {
						return;
					}
					clearInterval( timeoutId );
					buildEditor();
				}, iframeKeepAliveInterval );
			}

			buildEditor();
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
		var widgetContent, widgetForm, idBase, widgetControl, widgetId, animatedCheckDelay = 50, widgetInside, renderWhenAnimationDone;
		widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' ); // Note: '.form' appears in the customizer, whereas 'form' on the widgets admin screen.

		idBase = widgetForm.find( '> .id_base' ).val();
		if ( 'text' !== idBase ) {
			return;
		}

		widgetId = widgetForm.find( '> .widget-id' ).val();

		// Prevent initializing already-added widgets.
		if ( component.widgetControls[ widgetId ] ) {
			return;
		}

		widgetContent = widgetForm.find( '> .widget-content' );
		widgetControl = new component.TextWidgetControl({
			el: widgetContent
		});

		component.widgetControls[ widgetId ] = widgetControl;

		/*
		 * Render the widget once the widget parent's container finishes animating,
		 * as the widget-added event fires with a slideDown of the container.
		 * This ensures that the textarea is visible and an iframe can be embedded
		 * with TinyMCE being able to set contenteditable on it.
		 */
		widgetInside = widgetContainer.parent();
		renderWhenAnimationDone = function() {
			if ( widgetInside.is( ':animated' ) ) {
				setTimeout( renderWhenAnimationDone, animatedCheckDelay );
			} else {
				widgetControl.render();
			}
		};
		renderWhenAnimationDone();
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
