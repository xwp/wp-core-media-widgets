/* eslint consistent-this: [ "error", "control" ] */
(function( component ) {
	'use strict';

	var AudioWidgetModel, AudioWidgetControl;

	/**
	 * Audio widget model.
	 *
	 * See WP_Widget_Audio::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class AudioWidgetModel
	 * @constructor
	 */
	AudioWidgetModel = component.MediaWidgetModel.extend( {} );

	/**
	 * Audio widget control.
	 *
	 * See WP_Widget_Audio::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class AudioWidgetModel
	 * @constructor
	 */
	AudioWidgetControl = component.MediaWidgetControl.extend( {

		/**
		 * Render preview.
		 *
		 * @returns {void}
		 */
		renderPreview: function renderPreview() {
			var control = this, model = control.selectedAttachment.attributes, previewContainer, previewTemplate;
			model = _.extend( {}, model, {
				src: model.url,
				type: model.url.split( '.' ).pop()
			} );
			previewContainer = control.$el.find( '.media-widget-preview .rendered' );
			previewTemplate = wp.template( 'wp-media-widget-audio-preview' );
			previewContainer.html( previewTemplate( { model: model } ) );
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
				autiplay: displaySettings.autoplay,
				canEmbed: displaySettings.canEmbed,
				caption: attachment.caption,
				description: attachment.description,
				link: displaySettings.link,
				linkUrl: displaySettings.linkUrl,
				loop: displaySettings.loop,
				size: displaySettings.size,
				src: attachment.url,
				type: attachment.filename.split('.').pop()
			};

			return props;
		},

		/**
		 * Open the media audio-edit frame to modify the selected item.
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
				extraClasses: control.model.get( 'audio_classes' ),
				link: control.model.get( 'link_type' ),
				linkClassName: control.model.get( 'link_classes' ),
				linkRel: control.model.get( 'link_rel' ),
				linkTargetBlank: control.model.get( 'link_target_blank' ),
				linkUrl: control.model.get( 'link_url' ),
				size: control.model.get( 'size' ),
				title: control.model.get( 'audio_title' ),
				url: control.model.get( 'url' )
			};

			// Set up the media frame.
			mediaFrame = wp.media({
				frame: 'audio',
				state: 'audio-details',
				metadata: metadata
			} );

			updateCallback = function( audioData ) {
				var attachment;

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				attachment = mediaFrame.state().attributes.audio.toJSON();
				attachment.error = false;
				control.selectedAttachment.set( attachment );

				control.model.set( {
					attachment_id: audioData.attachment_id,
					alt: audioData.alt,
					align: audioData.align,
					caption: audioData.caption,
					audio_classes: audioData.extraClasses,
					audio_title: audioData.title,
					link_classes: audioData.linkClassName,
					link_rel: audioData.linkRel,
					link_target_blank: audioData.linkTargetBlank,
					link_type: audioData.link,
					link_url: audioData.linkUrl,
					size: audioData.size,
					url: audioData.url,
					width: 'custom' === audioData.size ? audioData.customWidth : audioData.width,
					height: 'custom' === audioData.size ? audioData.customHeight : audioData.height
				} );

				wp.mediaelement.initialize();
			};

			mediaFrame.state( 'audio-details' ).on( 'update', updateCallback );
			mediaFrame.state( 'replace-audio' ).on( 'replace', updateCallback );
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
	component.controlConstructors.media_audio = AudioWidgetControl;
	component.modelConstructors.media_audio = AudioWidgetModel;

})( wp.mediaWidgets );
