/* global tinymce, switchEditors */
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

			if ( ! options.el ) {
				throw new Error( 'Missing options.el' );
			}

			Backbone.View.prototype.initialize.call( control, options );

			/*
			 * Create a container element for the widget control fields.
			 * This is inserted into the DOM immediately before the the .widget-content
			 * element because the contents of this element are essentially "managed"
			 * by PHP, where each widget update cause the entire element to be emptied
			 * and replaced with the rendered output of WP_Widget::form() which is
			 * sent back in Ajax request made to save/update the widget instance.
			 * To prevent a "flash of replaced DOM elements and re-initialized JS
			 * components", the JS template is rendered outside of the normal form
			 * container.
			 */
			control.fieldContainer = $( '<div class="text-widget-fields"></div>' );
			control.fieldContainer.html( wp.template( 'widget-text-control-fields' ) );
			control.widgetContentContainer = control.$el.find( '.widget-content:first' );
			control.widgetContentContainer.before( control.fieldContainer );

			control.fields = {
				title: control.fieldContainer.find( '.title' ),
				text: control.fieldContainer.find( '.text' )
			};

			// Sync input fields to hidden sync fields which actually get sent to the server.
			_.each( control.fields, function( fieldInput, fieldName ) {
				fieldInput.on( 'input change', function updateSyncField() {
					var syncInput = control.widgetContentContainer.find( 'input[type=hidden].' + fieldName );
					if ( syncInput.val() !== $( this ).val() ) {
						syncInput.val( $( this ).val() );
						syncInput.trigger( 'change' );
					}
				});

				// Note that syncInput cannot be re-used because it will be destroyed with each widget-updated event.
				fieldInput.val( control.widgetContentContainer.find( 'input[type=hidden].' + fieldName ).val() );
			});
		},

		/**
		 * Update input fields from the sync fields.
		 *
		 * This function is called at the widget-updated and widget-synced events.
		 * A field will only be updated if it is not currently focused, to avoid
		 * overwriting content that the user is entering.
		 *
		 * @returns {void}
		 */
		updateFields: function updateFields() {
			var control = this, syncInput;

			if ( ! control.fields.title.is( document.activeElement ) ) {
				syncInput = control.widgetContentContainer.find( 'input[type=hidden].title' );
				control.fields.title.val( syncInput.val() );
			}

			syncInput = control.widgetContentContainer.find( 'input[type=hidden].text' );
			if ( control.fields.text.is( ':visible' ) ) {
				if ( ! control.fields.text.is( document.activeElement ) ) {
					control.fields.text.val( syncInput.val() );
				}
			} else if ( control.editor && ! control.editorFocused && syncInput.val() !== control.fields.text.val() ) {
				control.editor.setContent( wp.editor.autop( syncInput.val() ) );
			}
		},

		/**
		 * Initialize editor.
		 *
		 * @returns {void}
		 */
		initializeEditor: function initializeEditor() {
			var control = this, changeDebounceDelay = 1000, iframeKeepAliveInterval = 1000, id, textarea, restoreTextMode = false;
			textarea = control.fields.text;
			id = textarea.attr( 'id' );

			/**
			 * Build (or re-build) the visual editor.
			 *
			 * @returns {void}
			 */
			function buildEditor() {
				var editor, triggerChangeIfDirty, onInit;

				// Destroy any existing editor so that it can be re-initialized after a widget-updated event.
				if ( tinymce.get( id ) )    {
					restoreTextMode = tinymce.get( id ).isHidden();
					wp.editor.remove( id );
				}

				wp.editor.initialize( id, {
					tinymce: {
						wpautop: true
					},
					quicktags: true
				} );

				editor = window.tinymce.get( id );
				if ( ! editor ) {
					throw new Error( 'Failed to initialize editor' );
				}
				onInit = function() {
					watchForDestroyedBody( control.$el.find( 'iframe' )[0] );

					// If a prior mce instance was replaced, and it was in text mode, toggle to text mode.
					if ( restoreTextMode ) {
						switchEditors.go( id, 'toggle' );
					}
				};

				if ( editor.initialized ) {
					onInit();
				} else {
					editor.on( 'init', onInit );
				}

				control.editorFocused = false;
				triggerChangeIfDirty = function() {
					if ( editor.isDirty() ) {
						editor.save();
						textarea.trigger( 'change' );
					}
				};
				editor.on( 'focus', function() {
					control.editorFocused = true;
				} );
				editor.on( 'NodeChange', _.debounce( triggerChangeIfDirty, changeDebounceDelay ) );
				editor.on( 'blur', function() {
					control.editorFocused = false;
					triggerChangeIfDirty();
				} );

				control.editor = editor;
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
		var widgetForm, idBase, widgetControl, widgetId, animatedCheckDelay = 50, widgetInside, renderWhenAnimationDone;
		widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' ); // Note: '.form' appears in the customizer, whereas 'form' on the widgets admin screen.

		idBase = widgetForm.find( '> .id_base' ).val();
		if ( 'text' !== idBase ) {
			return;
		}

		// Prevent initializing already-added widgets.
		widgetId = widgetForm.find( '> .widget-id' ).val();
		if ( component.widgetControls[ widgetId ] ) {
			return;
		}

		widgetControl = new component.TextWidgetControl({
			el: widgetContainer
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
				widgetControl.initializeEditor();
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

		widgetControl.updateFields();
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
		$document.on( 'widget-synced widget-updated', component.handleWidgetUpdated );

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
