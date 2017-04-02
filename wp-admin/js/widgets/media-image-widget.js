/* eslint consistent-this: [ "error", "control" ] */
(function( component ) {
	'use strict';

	var ImageWidgetModel, ImageWidgetControl;

	/**
	 * Image widget model.
	 *
	 * See WP_Widget_Image::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class ImageWidgetModel
	 * @constructor
	 */
	ImageWidgetModel = component.MediaWidgetModel.extend( {} );

	/**
	 * Image widget control.
	 *
	 * See WP_Widget_Image::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class ImageWidgetModel
	 * @constructor
	 */
	ImageWidgetControl = component.MediaWidgetControl.extend( {

		/**
		 * Render preview.
		 *
		 * @returns {void}
		 */
		renderPreview: function renderPreview() {
			var control = this, previewContainer, previewTemplate;
			previewContainer = control.$el.find( '.media-widget-preview .rendered' );
			previewTemplate = wp.template( 'wp-media-widget-image-preview' );
			previewContainer.html( previewTemplate( { attachment: control.selectedAttachment.attributes } ) );
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame Select frame.
		 * @returns {object} Props
		 */
		getSelectFrameProps: function getSelectFrameProps( mediaFrame ) {
			var attachment = mediaFrame.content.get( '.attachments-browser' ).model.get( 'selection' ).at( 0 ).toJSON(),
				props = {};

			if ( ! _.isEmpty( attachment ) ) {
				props = {
					attachment_id: attachment.id,
					alt: attachment.alt,
					caption: attachment.caption,
					image_classes: '',
					image_title: '',
					link_classes: '',
					link_rel: '',
					link_url: attachment.link,
					link_target_blank: false,
					link_type: attachment.link,
					size: 'thumbnail',
					url: attachment.sizes.thumbnail.url,
					width: 0, // Reset.
					height: 0 // Reset.
				};
			}

			return props;
		},

		/**
		 * Open the media image-edit frame to modify the selected item.
		 *
		 * @returns {void}
		 */
		editMedia: function editMedia() {
			var control = this, mediaFrame, metadata, updateCallback, mediaFrameContentView;

			metadata = {
				attachment_id: control.model.get( 'attachment_id' ),
				alt: control.model.get( 'alt' ),
				align: control.model.get( 'align' ),
				caption: control.model.get( 'caption' ),
				customWidth: control.model.get( 'width' ),
				customHeight: control.model.get( 'height' ),
				extraClasses: control.model.get( 'image_classes' ),
				link: control.model.get( 'link_type' ),
				linkClassName: control.model.get( 'link_classes' ),
				linkRel: control.model.get( 'link_rel' ),
				linkTargetBlank: control.model.get( 'link_target_blank' ),
				linkUrl: control.model.get( 'link_url' ),
				size: control.model.get( 'size' ),
				title: control.model.get( 'image_title' ),
				url: control.model.get( 'url' )
			};

			// Set up the media frame.
			mediaFrame = wp.media({
				frame: 'image',
				state: 'image-details',
				metadata: metadata
			} );

			updateCallback = function( imageData ) {
				var attachment;

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				attachment = mediaFrame.state().attributes.image.toJSON();
				attachment.error = false;
				control.selectedAttachment.set( attachment );

				control.model.set( {
					attachment_id: imageData.attachment_id,
					alt: imageData.alt,
					align: imageData.align,
					caption: imageData.caption,
					image_classes: imageData.extraClasses,
					image_title: imageData.title,
					link_classes: imageData.linkClassName,
					link_rel: imageData.linkRel,
					link_target_blank: imageData.linkTargetBlank,
					link_type: imageData.link,
					link_url: imageData.linkUrl,
					size: imageData.size,
					url: imageData.url,
					width: 'custom' === imageData.size ? imageData.customWidth : imageData.width,
					height: 'custom' === imageData.size ? imageData.customHeight : imageData.height
				} );
			};

			mediaFrame.state( 'image-details' ).on( 'update', updateCallback );
			mediaFrame.state( 'replace-image' ).on( 'replace', updateCallback );
			mediaFrame.on( 'close', function() {
				mediaFrame.detach();
			});

			mediaFrame.open();

			/*
			 * Make sure focus is set inside of modal so that hitting Esc will close
			 * the modal and not inadvertently cause the widget to collapse in the
			 * customizer.
			 */
			mediaFrameContentView = mediaFrame.views.get( '.media-frame-content' )[0];
			if ( mediaFrameContentView.model.dfd ) {
				mediaFrameContentView.model.dfd.done( function() {
					_.defer( function() { // Next tick.
						mediaFrameContentView.$el.find( '[data-setting="caption"]:first' ).focus();
					} );
				} );
			} else {
				_.defer( function() {
					jQuery( '.media-frame-content [data-setting="caption"]:first' ).focus();
				} );
			}
		}
	} );

	// Exports.
	component.controlConstructors.media_image = ImageWidgetControl;
	component.modelConstructors.media_image = ImageWidgetModel;

})( wp.mediaWidgets );
