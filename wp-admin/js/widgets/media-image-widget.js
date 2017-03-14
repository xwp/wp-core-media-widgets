/* eslint consistent-this: [ "error", "control" ] */
(function( component ) {
	'use strict';

	var ImageWidgetModel, ImageWidgetControl;

	// Defaults will get set via WP_Widget_Image::enqueue_admin_scripts().
	ImageWidgetModel = component.MediaWidgetModel.extend( {} );

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
			var attachment, displaySettings, props;

			attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
			if ( _.isEmpty( attachment ) ) {
				return {};
			}

			displaySettings = mediaFrame.content.get( '.attachments-browser' ).sidebar.get( 'display' ).model.toJSON();

			props = {
				attachment_id: attachment.id,
				url: attachment.url,
				size: displaySettings.size,
				width: 0, // Reset.
				height: 0, // Reset.
				align: displaySettings.align,
				caption: attachment.caption,
				alt: attachment.alt,
				link_type: displaySettings.link,
				link_url: displaySettings.link_url
			};

			return props;
		},

		/**
		 * Open the media select frame to chose an item.
		 *
		 * @returns {void}
		 */
		selectMedia: function selectMedia() {
			var control = this, selection, mediaFrame;

			selection = new wp.media.model.Selection( [ control.selectedAttachment ] );

			mediaFrame = wp.media( {
				frame: 'select',
				button: {
					text: control.l10n.add_to_widget
				},
				states: new wp.media.controller.Library( {
					library: wp.media.query( {
						type: control.mime_type
					} ),
					title: control.l10n.select_media,
					selection: selection,
					multiple: false,
					priority: 20,
					display: true, // Attachment display setting.
					filterable: false
				} )
			} );

			mediaFrame.on( 'select', function() {
				var attachment;

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
				control.selectedAttachment.set( attachment );

				// Update widget instance.
				control.model.set( control.getSelectFrameProps( mediaFrame ) );
			} );

			mediaFrame.open();
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
				align: control.model.get( 'align' ),
				link: control.model.get( 'link_type' ),
				linkUrl: control.model.get( 'link_url' ),
				size: control.model.get( 'size' ),
				caption: control.model.get( 'caption' ),
				alt: control.model.get( 'alt' ),
				extraClasses: control.model.get( 'image_classes' ),
				linkClassName: control.model.get( 'link_classes' ),
				linkRel: control.model.get( 'link_rel' ),
				linkTargetBlank: control.model.get( 'link_target_blank' ),
				title: control.model.get( 'image_title' ),
				customWidth: control.model.get( 'width' ),
				customHeight: control.model.get( 'height' ),
				url: control.model.get( 'url' )
			};

			wp.media.events.trigger( 'editor:image-edit', {
				metadata: metadata,
				image: control.$el.find( 'img:first' )
			} );

			// Set up the media frame.
			mediaFrame = wp.media({
				frame: 'image',
				state: 'image-details',
				metadata: metadata
			} );

			updateCallback = function( imageData ) {
				control.model.set( {
					attachment_id: imageData.attachment_id,
					url: imageData.url,
					align: imageData.align,
					link_type: imageData.link,
					link_url: imageData.linkUrl,
					size: imageData.size,
					caption: imageData.caption,
					alt: imageData.alt,
					image_classes: imageData.extraClasses,
					link_classes: imageData.linkClassName,
					link_rel: imageData.linkRel,
					link_target_blank: imageData.linkTargetBlank,
					image_title: imageData.title,
					width: 'custom' === imageData.size ? imageData.customWidth : imageData.width,
					height: 'custom' === imageData.size ? imageData.customHeight : imageData.height
				} );

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				control.selectedAttachment.set( mediaFrame.state().attributes.image.attachment.attributes );
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
