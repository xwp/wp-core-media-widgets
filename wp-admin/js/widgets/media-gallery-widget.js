/* eslint consistent-this: [ "error", "control" ] */
(function( component ) {
	'use strict';

	var GalleryWidgetModel, GalleryWidgetControl, GalleryDetailsMediaFrame;

	/**
	 * Custom gallery details frame.
	 *
	 * @class GalleryDetailsMediaFrame
	 * @constructor
	 */
	GalleryDetailsMediaFrame = wp.media.view.MediaFrame.Post.extend( {

		/**
		 * Create the default states.
		 *
		 * @returns {void}
		 */
		createStates: function createStates() {
			this.states.add([
				new wp.media.controller.Library({
					id:         'gallery',
					title:      wp.media.view.l10n.createGalleryTitle,
					priority:   40,
					toolbar:    'main-gallery',
					filterable: 'uploaded',
					multiple:   'add',
					editable:   false,

					library:  wp.media.query( _.defaults({
						type: 'image'
					}, this.options.library ) )
				}),

				// Gallery states.
				new wp.media.controller.GalleryEdit({
					library: this.options.selection,
					editing: this.options.editing,
					menu:    'gallery'
				}),

				new wp.media.controller.GalleryAdd()
			]);
		}
	} );

	/**
	 * Gallery widget model.
	 *
	 * See WP_Widget_Gallery::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class GalleryWidgetModel
	 * @constructor
	 */
	GalleryWidgetModel = component.MediaWidgetModel.extend( {} );

	/**
	 * Gallery widget control.
	 *
	 * See WP_Widget_Gallery::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class GalleryWidgetControl
	 * @constructor
	 */
	GalleryWidgetControl = component.MediaWidgetControl.extend( {


		/**
		 * Render preview.
		 *
		 * @returns {void}
		 */
		renderPreview: function renderPreview() {
			var control = this, previewContainer, previewTemplate;
			previewContainer = control.$el.find( '.media-widget-preview' );
			previewTemplate = wp.template( 'wp-media-widget-gallery-preview' );
			previewContainer.html( previewTemplate( _.extend( control.previewTemplateProps.toJSON() ) ) );
		},

		/**
		 * Open the media select frame to chose an item.
		 *
		 * @returns {void}
		 */
		selectMedia: function selectMedia() {
			var control = this, selection, mediaFrame, defaultSync, mediaFrameProps;

			if ( control.isSelected() && 0 !== control.model.get( 'attachment_id' ) ) {
				selection = new wp.media.model.Selection( [ control.selectedAttachment ] );
			} else {
				selection = null;
			}

			mediaFrameProps = control.mapModelToMediaFrameProps( control.model.toJSON() );
			if ( mediaFrameProps.size ) {
				control.displaySettings.set( 'size', mediaFrameProps.size );
			}

			mediaFrame = new GalleryDetailsMediaFrame({
				frame: 'select',
				text: control.l10n.add_to_widget,
				selection: selection,
				mimeType: control.mime_type,
				selectedDisplaySettings: control.displaySettings,
				showDisplaySettings: control.showDisplaySettings,
				metadata: mediaFrameProps,
				state: 'gallery'
			});
			wp.media.frame = mediaFrame; // See wp.media().

			// Handle selection of a media item.
			mediaFrame.on( 'reset', function onInsert() {
				var state = mediaFrame.state();
console.log(wp.media.controller.state().get('selection'));
			});

			// Disable syncing of attachment changes back to server. See <https://core.trac.wordpress.org/ticket/40403>.
			defaultSync = wp.media.model.Attachment.prototype.sync;
			wp.media.model.Attachment.prototype.sync = function rejectedSync() {
				return $.Deferred().rejectWith( this ).promise();
			};
			mediaFrame.on( 'close', function onClose() {
				wp.media.model.Attachment.prototype.sync = defaultSync;
			});

			mediaFrame.$el.addClass( 'media-widget' );
			mediaFrame.open();

			// Clear the selected attachment when it is deleted in the media select frame.
			if ( selection ) {
				selection.on( 'destroy', function onDestroy( attachment ) {
					if ( control.model.get( 'attachment_id' ) === attachment.get( 'id' ) ) {
						control.model.set({
							attachment_id: 0,
							url: ''
						});
					}
				});
			}

			/*
			 * Make sure focus is set inside of modal so that hitting Esc will close
			 * the modal and not inadvertently cause the widget to collapse in the customizer.
			 */
			mediaFrame.$el.find( ':focusable:first' ).focus();
		}
	} );

	// Exports.
	component.controlConstructors.media_gallery = GalleryWidgetControl;
	component.modelConstructors.media_gallery = GalleryWidgetModel;

})( wp.mediaWidgets );
