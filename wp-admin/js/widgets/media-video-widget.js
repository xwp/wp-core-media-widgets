/* eslint consistent-this: [ "error", "control" ] */
(function( component, $ ) {
	'use strict';

	var VideoWidgetModel, VideoWidgetControl;

	/**
	 * Video widget model.
	 *
	 * See WP_Widget_Video::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class VideoWidgetModel
	 * @constructor
	 */
	VideoWidgetModel = component.MediaWidgetModel.extend( {} );

	/**
	 * Video widget control.
	 *
	 * See WP_Widget_Video::enqueue_admin_scripts() for amending prototype from PHP exports.
	 *
	 * @class VideoWidgetControl
	 * @constructor
	 */
	VideoWidgetControl = component.MediaWidgetControl.extend( {

		/**
		 * Render preview.
		 *
		 * @returns {void}
		 */
		renderPreview: function renderPreview() {
			var control = this, previewContainer, previewTemplate, attachmentId, attachmentUrl;
			attachmentId = control.model.get( 'attachment_id' );
			attachmentUrl = control.model.get( 'url' );

			if ( ! attachmentId && ! attachmentUrl ) {
				return;
			}

			previewContainer = control.$el.find( '.media-widget-preview' );
			previewTemplate = wp.template( 'wp-media-widget-video-preview' );

			// If no attachment get the external thumbnail
			if ( ! attachmentId ) {
				control.getExternalThumbnail().done( function( response ) {
					previewContainer.html( previewTemplate( {
						model: {
							src: response.thumbnail_url
						},
						error: control.model.get( 'error' )
					} ) );
				} );
			} else {
				previewContainer.html( previewTemplate( {
					model: {
						attachment_id: control.model.get( 'attachment_id' ),
						src: attachmentUrl,
						width: control.model.get( 'width' ),
						height: control.model.get( 'width' )
					},
					error: control.model.get( 'error' )
				} ) );
			}

		},

		/**
		 * Get the external video thumbnail for the preview
		 *
		 * @returns {Promise} CORS response
		 */
		getExternalThumbnail: function getExternalThumbnail() {
			var control = this, url, isYouTube, isVimeo, deffered;
			url = control.model.get( 'url' );
			isYouTube = url.match( /youtube|youtu\.be/ );
			isVimeo = -1 !== url.indexOf('vimeo');
			deffered = $.Deferred();

			// If the external video is hosted elsewhere, return default icon
			// TODO: Get markup/image for generic thumbnail
			if ( ! isYouTube && ! isVimeo ) {
				return deffered.resolveWith( control, [ { thumbnail_url: '' } ] ).promise();
			}

			// YouTube does not support CORS
			if ( isYouTube ) {
				return deffered.resolveWith( control, [ {
					thumbnail_url: 'https://img.youtube.com/vi/' + control._getYouTubeIdFromUrl( url ) + '/mqdefault.jpg'
				} ] ).promise();
			}

			// Else request Vimeo oembed data
			return $.ajax( {
				url: 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent( url ),
				type: 'GET',
				crossDomain: true,
				dataType: 'json'
			} );
		},

		/**
		 * Get YouTube video ID from URL
		 *
		 * @param {string} url from model
		 * @returns {string} YouTube video ID
		 */
		_getYouTubeIdFromUrl: function _getYouTubeIdFromUrl( url ) {
			var urlParts;
			urlParts = url.split( /(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/ );
			return urlParts[2] !== undefined ? urlParts[2].split( /[^0-9a-z_\-]/i )[0] : urlParts[0];
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
					caption: attachment.caption,
					description: attachment.description,
					link_type: displaySettings.link,
					url: attachment.url
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
					caption: attachment.caption,
					description: attachment.description,
					link_type: attachment.link,
					url: attachment.url
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
				caption: control.model.get( 'caption' ),
				description: control.model.get( 'description' ),
				link_type: control.model.get( 'link_type' )
			};

			// Set up the media frame.
			mediaFrame = wp.media({
				frame: 'video',
				state: 'video-details',
				metadata: metadata
			} );

			updateCallback = function( mediaData ) {
				var attachment;

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				attachment = mediaData;
				attachment.error = false;
				control.selectedAttachment.set( attachment );

				control.model.set( {
					attachment_id: mediaData.attachment_id,
					autoplay: mediaData.autoplay,
					caption: mediaData.caption,
					description: mediaData.description,
					link_type: mediaData.link,
					loop: mediaData.loop,
					url: mediaData.url
				} );
			};

			// TODO: additional states. which do we track?
			// add-video-source select-poster-image add-track
			mediaFrame.state( 'video-details' ).on( 'update', updateCallback );
			mediaFrame.state( 'replace-video' ).on( 'replace', updateCallback );
			mediaFrame.on( 'close', function() {
				mediaFrame.detach();
			});

			mediaFrame.open();

		}
	} );

	// Exports.
	component.controlConstructors.media_video = VideoWidgetControl;
	component.modelConstructors.media_video = VideoWidgetModel;

})( wp.mediaWidgets, jQuery );
