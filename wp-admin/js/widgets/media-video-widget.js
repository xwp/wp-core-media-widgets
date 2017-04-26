/* eslint consistent-this: [ "error", "control" ] */
(function( component ) {
	'use strict';

	var VideoWidgetModel, VideoWidgetControl, VideoDetailsMediaFrame;

	/**
	 * Custom video details frame that removes the replace-video state.
	 *
	 * @class VideoDetailsMediaFrame
	 * @constructor
	 */
	VideoDetailsMediaFrame = wp.media.view.MediaFrame.VideoDetails.extend({

		/**
		 * Create the default states.
		 *
		 * @returns {void}
		 */
		createStates: function createStates() {
			this.states.add([
				new wp.media.controller.VideoDetails({
					media: this.media
				}),

				new wp.media.controller.MediaLibrary( {
					type: 'video',
					id: 'add-video-source',
					title: wp.media.view.l10n.videoAddSourceTitle,
					toolbar: 'add-video-source',
					media: this.media,
					menu: false
				} ),

				new wp.media.controller.MediaLibrary( {
					type: 'image',
					id: 'select-poster-image',
					title: wp.media.view.l10n.videoSelectPosterImageTitle,
					toolbar: 'select-poster-image',
					media: this.media,
					menu: 'video-details'
				} ),

				new wp.media.controller.MediaLibrary( {
					type: 'text',
					id: 'add-track',
					title: wp.media.view.l10n.videoAddTrackTitle,
					toolbar: 'add-track',
					media: this.media,
					menu: 'video-details'
				} )
			]);
		}
	});

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
		 * Show display settings.
		 *
		 * @type {boolean}
		 */
		showDisplaySettings: false,

		/**
		 * Map model props to media frame props.
		 *
		 * @param {Object} modelProps - Model props.
		 * @returns {Object} Media frame props.
		 */
		mapModelToMediaFrameProps: function mapModelToMediaFrameProps( modelProps ) {
			var control = this, mediaFrameProps;
			mediaFrameProps = component.MediaWidgetControl.prototype.mapModelToMediaFrameProps.call( control, modelProps );
			mediaFrameProps.link = 'embed';
			return mediaFrameProps;
		},

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

			previewContainer.html( previewTemplate( {
				model: {
					attachment_id: control.model.get( 'attachment_id' ),
					src: attachmentUrl,
					poster: control.model.get( 'poster' )
				},
				error: control.model.get( 'error' )
			} ) );
		},

		/**
		 * Open the media image-edit frame to modify the selected item.
		 *
		 * @returns {void}
		 */
		editMedia: function editMedia() {
			var control = this, mediaFrame, metadata, updateCallback;

			metadata = control.mapModelToMediaFrameProps( control.model.toJSON() );

			// Set up the media frame.
			mediaFrame = new VideoDetailsMediaFrame({
				frame: 'video',
				state: 'video-details',
				metadata: metadata
			});
			wp.media.frame = mediaFrame;

			updateCallback = function( mediaFrameProps ) {

				// Update cached attachment object to avoid having to re-fetch. This also triggers re-rendering of preview.
				control.selectedAttachment.set( mediaFrameProps );

				control.model.set( _.extend(
					control.model.defaults(),
					control.mapMediaToModelProps( mediaFrameProps ),
					{ error: false }
				) );
			};

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

})( wp.mediaWidgets );
