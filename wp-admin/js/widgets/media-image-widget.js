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
			var attachment, displaySettings, props;

			attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
			if ( _.isEmpty( attachment ) ) {
				return {};
			}

			displaySettings = mediaFrame.content.get( '.attachments-browser' ).sidebar.get( 'display' ).model.toJSON();

			props = {
				attachment_id: attachment.id,
				align: displaySettings.align,
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
			};

			return props;
		},

		/**
		 * Open the media select frame to chose an item.
		 *
		 * @returns {void}
		 */
		selectMedia: function selectMedia() {
			var control = this, selection, mediaFrame, displaySettingsView;

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

			// @todo There must be a better way to access this view.
			displaySettingsView = mediaFrame.views.get( '.media-frame-content' )[0].sidebar._views.display;

			displaySettingsView.model.set( {
				align: control.model.get( 'align' ),
				linkUrl: control.model.get( 'link_url' ),
				size: control.model.get( 'size' )
			} );

			/*
			 * Set link type last due to AttachmentDisplay.updateLinkTo() blowing
			 * the linkUrl if linkUrl change gets made before the link change.
			 */
			displaySettingsView.model.set( 'link', control.model.get( 'link_type' ) );
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

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				control.selectedAttachment.set( mediaFrame.state().attributes.image.attachment.attributes );

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
		}
	} );

	// Exports.
	component.controlConstructors.media_image = ImageWidgetControl;
	component.modelConstructors.media_image = ImageWidgetModel;

})( wp.mediaWidgets );
