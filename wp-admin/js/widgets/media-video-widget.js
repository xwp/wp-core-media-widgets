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
			var control = this, previewContainer, model, previewTemplate, attachmentId, attachmentUrl;
			attachmentId = control.model.get( 'attachment_id' );
			attachmentUrl = control.model.get( 'url' );

			if ( ! attachmentId && ! attachmentUrl ) {
				return;
			}

			previewContainer = control.$el.find( '.media-widget-preview' );
			previewTemplate = wp.template( 'wp-media-widget-video-preview' );

			// If no attachment get the external thumbnail.
			model = {
				attachment_id: control.model.get( 'attachment_id' ),
				src: attachmentUrl,
				poster: control.model.get( 'poster' )
			};
			if ( ! attachmentId && ! control.model.get( 'poster' ) ) {
				control.getExternalThumbnail().done( function( response ) {
					model.poster = response.thumbnail_url;
					previewContainer.html( previewTemplate( {
						model: model,
						error: control.model.get( 'error' )
					} ) );
				} );
			} else {
				previewContainer.html( previewTemplate( {
					model: model,
					error: control.model.get( 'error' )
				} ) );
			}

		},

		/**
		 * Get the external video thumbnail for the preview
		 *
		 * @returns {Promise} Promise that resolves with oEmbed object containing thumbnail_url.
		 */
		getExternalThumbnail: function getExternalThumbnail() {
			var control = this, urlParser = document.createElement( 'a' );
			urlParser.href = control.model.get( 'url' );

			// YouTube does not support CORS, but the thumbnail URL can be constructed from the video ID.
			if ( /youtube|youtu\.be/.test( urlParser.hostname ) ) {
				return $.Deferred().resolveWith( control, [ {
					thumbnail_url: 'https://img.youtube.com/vi/' + control._getYouTubeIdFromUrl( control.model.get( 'url' ) ) + '/mqdefault.jpg'
				} ] ).promise();
			}

			// Else request Vimeo oEmbed data.
			if ( /vimeo/.test( urlParser.hostname ) ) {
				return $.ajax( {
					url: 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent( control.model.get( 'url' ) ),
					type: 'GET',
					crossDomain: true,
					dataType: 'json'
				} );
			}

			// If the external video is hosted elsewhere, return default icon.
			// TODO: Get markup/image for generic thumbnail
			return $.Deferred().resolveWith( control, [ { thumbnail_url: '' } ] ).promise();
		},

		/**
		 * Get YouTube video ID from URL.
		 *
		 * @param {string} url URL from model.
		 * @returns {string} YouTube video ID
		 */
		_getYouTubeIdFromUrl: function _getYouTubeIdFromUrl( url ) {
			var urlParts;
			urlParts = url.split( /(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/ );
			return ! _.isUndefined( urlParts[2] ) ? urlParts[2].split( /[^0-9a-z_\-]/i )[0] : urlParts[0];
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
				autoplay: control.model.get( 'autoplay' ),
				caption: control.model.get( 'caption' ),
				description: control.model.get( 'description' ),
				link_type: control.model.get( 'link_type' ),
				loop: control.model.get( 'loop' ),
				poster: control.model.get( 'poster' ),
				preload: control.model.get( 'preload' ),
				url: control.model.get( 'url' )
			};

			// Set up the media frame.
			mediaFrame = wp.media({
				frame: 'video',
				state: 'video-details',
				metadata: metadata
			} );

			updateCallback = function( mediaData ) {

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				control.model.set( 'error', false );
				control.selectedAttachment.set( mediaData );

				control.model.set( {
					attachment_id: mediaData.attachment_id,
					autoplay: mediaData.autoplay,
					caption: mediaData.caption,
					description: mediaData.description,
					link_type: mediaData.link,
					loop: mediaData.loop,
					poster: mediaData.poster || '',
					preload: mediaData.preload,
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
