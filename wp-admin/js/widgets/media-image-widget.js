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
		 * @param {jQuery.Event} event - Event.
		 * @returns {void}
		 */
		selectMedia: function selectMedia( event ) {
			var control = this, selection, mediaFrame, library, CustomizedDisplaySettingsLibrary, customizedDisplaySettings;

			event.preventDefault();

			selection = new wp.media.model.Selection( [ control.selectedAttachment ] );

			/*
			 * Copy current display settings from the widget model to serve as basis
			 * of customized display settings for the current media frame session.
			 * Changes to display settings will be synced into this model, and
			 * when a new selection is made, the settings from this will be synced
			 * into that AttachmentDisplay's model to persist the setting changes.
			 */
			customizedDisplaySettings = new Backbone.Model( {
				align: control.model.get( 'align' ),
				size: control.model.get( 'size' ),
				link: control.model.get( 'link_type' ),
				linkUrl: control.model.get( 'link_url' )
			} );

			/**
			 * Library which persists the customized display settings across selections.
			 *
			 * @class
			 */
			CustomizedDisplaySettingsLibrary = wp.media.controller.Library.extend( {

				/**
				 * Sync changes to the current display settings back into the current customized
				 *
				 * @param {Backbone.Model} displaySettings Modified display settings.
				 * @returns {void}
				 */
				handleDisplaySettingChange: function handleDisplaySettingChange( displaySettings ) {
					customizedDisplaySettings.set( displaySettings.attributes );
				},

				/**
				 * Get the display settings model.
				 *
				 * Model returned is updated with the current customized display settings,
				 * and an event listener is added so that changes made to the settings
				 * will sync back into the model storing the session's customized display
				 * settings.
				 *
				 * @param {Backbone.Model} model Display settings model.
				 * @returns {Backbone.Model} Display settings model.
				 */
				display: function getDisplaySettingsModel( model ) {
					var display;
					display = wp.media.controller.Library.prototype.display.call( this, model );

					display.off( 'change', this.handleDisplaySettingChange ); // Prevent duplicated event handlers.
					display.set( customizedDisplaySettings.attributes );
					if ( 'custom' === customizedDisplaySettings.get( 'link_type' ) ) {
						display.linkUrl = customizedDisplaySettings.get( 'link_url' );
					}
					display.on( 'change', this.handleDisplaySettingChange );
					return display;
				}
			} );

			library = new CustomizedDisplaySettingsLibrary( {
				library: wp.media.query( {
					type: control.mime_type
				} ),
				title: control.l10n.select_media,
				selection: selection,
				multiple: false,
				priority: 20,
				display: true, // Attachment display setting.
				filterable: false
			} );

			mediaFrame = wp.media( {
				frame: 'select',
				button: {
					text: control.l10n.add_to_widget
				},
				states: library
			} );

			// Handle selection of a media item.
			mediaFrame.on( 'select', function() {
				var attachment;

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
				attachment.error = false;
				control.selectedAttachment.set( attachment );

				// Update widget instance.
				control.model.set( control.getSelectFrameProps( mediaFrame ) );
			} );

			mediaFrame.open();

			// Clear the selected attachment when it is deleted in the media select frame.
			selection.on( 'destroy', function( attachment ) {
				if ( control.model.get( 'attachment_id' ) === attachment.get( 'id' ) ) {
					control.model.set( {
						attachment_id: 0,
						url: ''
					} );
				}
			} );

			/*
			 * Make sure focus is set inside of modal so that hitting Esc will close
			 * the modal and not inadvertently cause the widget to collapse in the customizer.
			 */
			mediaFrame.$el.find( ':focusable:first' ).focus();
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
			mediaFrameContentView.model.dfd.done( function() {
				_.defer( function() { // Next tick.
					mediaFrameContentView.$el.find( '[data-setting="caption"]:first' ).focus();
				} );
			} );
		}
	} );

	// Exports.
	component.controlConstructors.media_image = ImageWidgetControl;
	component.modelConstructors.media_image = ImageWidgetModel;

})( wp.mediaWidgets );
