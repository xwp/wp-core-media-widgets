/* eslint consistent-this: [ "error", "control" ] */
(function( component, $ ) {
	'use strict';

	var ImageWidgetModel, ImageWidgetControl;

	/**
	 * Image widget model.
	 *
	 * See WP_Widget_Media_Image::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class ImageWidgetModel
	 * @constructor
	 */
	ImageWidgetModel = component.MediaWidgetModel.extend({});

	/**
	 * Image widget control.
	 *
	 * See WP_Widget_Media_Image::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class ImageWidgetModel
	 * @constructor
	 */
	ImageWidgetControl = component.MediaWidgetControl.extend({

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
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame - Select frame.
		 * @returns {Object} Props from select frame.
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
		 * @access private
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame - Select frame.
		 * @param {Object}                          attachment - Attachment object.
		 * @returns {Object} Attachment props.
		 */
		_getAttachmentProps: function _getAttachmentProps( mediaFrame, attachment ) {
			var props = {}, displaySettings;

			displaySettings = mediaFrame.content.get( '.attachments-browser' ).sidebar.get( 'display' ).model.toJSON();

			// @todo Make use of modelToMediaPropMap.
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
				});
			}

			return props;
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @access private
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame - Select frame.
		 * @param {Object}                          attachment - Attachment object.
		 * @returns {Object} Embed props.
		 */
		_getEmbedProps: function _getEmbedProps( mediaFrame, attachment ) {
			var props = {};

			// @todo Make use of modelToMediaPropMap.
			// @todo Make use of defaults in defined schema.
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
				});
			}

			return props;
		},

		/**
		 * Open the media image-edit frame to modify the selected item.
		 *
		 * @returns {void}
		 */
		editMedia: function editMedia() {
			var control = this, mediaFrame, updateCallback, defaultSync, metadata;

			metadata = control.mapModelToMediaFrameProps();

			// @todo Add this to subclass of mapModelToMediaFrameProps?
			// Needed or else none will not be selected if linkUrl is not also empty.
			if ( 'none' === metadata.link ) {
				metadata.linkUrl = '';
			}

			// Set up the media frame.
			mediaFrame = wp.media({
				frame: 'image',
				state: 'image-details',
				metadata: metadata
			});
			mediaFrame.$el.addClass( 'media-widget' );

			updateCallback = function( imageData ) {
				var attachment;

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				attachment = mediaFrame.state().attributes.image;
				control.selectedAttachment.set( attachment.toJSON() );
				control.model.set( 'error', false );

				// @todo Make use of modelToMediaPropMap.
				control.model.set({
					id: imageData.attachment_id,
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
				});
			};

			mediaFrame.state( 'image-details' ).on( 'update', updateCallback );
			mediaFrame.state( 'replace-image' ).on( 'replace', updateCallback );

			// Disable syncing of attachment changes back to server. See <https://core.trac.wordpress.org/ticket/40403>.
			defaultSync = wp.media.model.Attachment.prototype.sync;
			wp.media.model.Attachment.prototype.sync = function rejectedSync() {
				return $.Deferred().rejectWith( this ).promise();
			};
			mediaFrame.on( 'close', function onClose() {
				mediaFrame.detach();
				wp.media.model.Attachment.prototype.sync = defaultSync;
			});

			mediaFrame.open();
		}
	});

	// Exports.
	component.controlConstructors.media_image = ImageWidgetControl;
	component.modelConstructors.media_image = ImageWidgetModel;

})( wp.mediaWidgets, jQuery );
