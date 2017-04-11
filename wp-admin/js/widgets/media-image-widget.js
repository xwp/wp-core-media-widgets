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
			previewContainer = control.$el.find( '.media-widget-preview' );
			previewTemplate = wp.template( 'wp-media-widget-image-preview' );
			previewContainer.html( previewTemplate( _.extend(
				control.model.toJSON(),
				{ attachment: control.selectedAttachment.toJSON() }
			) ) );
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame Select frame.
		 * @returns {object} Props
		 */
		getSelectFrameProps: function getSelectFrameProps( mediaFrame ) {
			var control = this,
				state = mediaFrame.state(),
				props = {};

			if ( 'embed' === state.get( 'id' ) ) {
				props = control._getEmbedProps( mediaFrame, state.props.toJSON() );
			} else {
				props = control._getAttachmentProps( mediaFrame, state.get( 'selection' ).first().toJSON() );
			}

			return props;
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame Select frame.
		 * @param {object} attachment Attachment object.
		 * @returns {object} Props
		 */
		_getAttachmentProps: function _getAttachmentProps( mediaFrame, attachment ) {
			var props = {}, displaySettings;

			displaySettings = mediaFrame.content.get( '.attachments-browser' ).sidebar.get( 'display' ).model.toJSON();

			if ( ! _.isEmpty( attachment ) ) {
				_.extend( props, {
					attachment_id: attachment.id,
					alt: attachment.alt,
					caption: attachment.caption,
					image_classes: '',
					image_title: '',
					link_classes: '',
					link_rel: '',
					link_url: displaySettings.linkUrl,
					link_target_blank: false,
					link_type: displaySettings.link,
					size: displaySettings.size,
					url: attachment.sizes[ displaySettings.size ].url,
					width: 0, // Reset.
					height: 0 // Reset.
				} );
			}

			return props;
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame Select frame.
		 * @param {object} attachment Attachment object.
		 * @returns {object} Props
		 */
		_getEmbedProps: function _getEmbedProps( mediaFrame, attachment ) {
			var props = {};

			if ( ! _.isEmpty( attachment ) ) {
				_.extend( props, {
					attachment_id: 0,
					alt: attachment.alt,
					caption: attachment.caption,
					image_classes: '',
					image_title: '',
					link_classes: '',
					link_rel: '',
					link_url: attachment.linkUrl,
					link_target_blank: false,
					link_type: attachment.link,
					size: 'full',
					url: attachment.url,
					width: attachment.width,
					height: attachment.height
				} );
			}

			return props;
		},

		/**
		 * Open the media image-edit frame to modify the selected item.
		 *
		 * @returns {void}
		 */
		editMedia: function editMedia() {
			var control = this, mediaFrame, metadata, updateCallback;

			metadata = {
				attachment_id: control.model.get( 'attachment_id' ),
				alt: control.model.get( 'alt' ),
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
			mediaFrame.$el.addClass( 'media-widget' );

			updateCallback = function( imageData ) {
				var attachment;

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				attachment = mediaFrame.state().attributes.image.toJSON();
				attachment.error = false;
				control.selectedAttachment.set( attachment );

				control.model.set( {
					attachment_id: imageData.attachment_id,
					alt: imageData.alt,
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

		}
	} );

	// Exports.
	component.controlConstructors.media_image = ImageWidgetControl;
	component.modelConstructors.media_image = ImageWidgetModel;

})( wp.mediaWidgets );
