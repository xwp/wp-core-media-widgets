/**
 * @since 4.8.0
 *
 * @package WP_Media_Widget
 */
( function( $, l10n ) {
	'use strict';

	var frame = {
		defaultProps: {
			id:    '',
			align: '',
			size:  '',
			link:  ''
		},

		/**
		 * Init.
		 *
		 * @returns {void}
		 */
		init: function() {
			frame.bindEvent();
			wp.mediaelement.initialize();
		},

		/**
		 * Bind event.
		 *
		 * @param {jQuery} context Element.
		 * @returns {void}
		 */
		bindEvent: function( context ) {
			$( '.button.select-media, .image', context || '.media-widget-preview' )
				.off( 'click.mediaWidget' )
				.on( 'click.mediaWidget', frame.openMediaManager );
		},

		/**
		 * Get current selection of media.
		 *
		 * @param {String} widgetId Widget ID.
		 * @returns {wp.media.models.Selection|null} Selection or null if no current selection.
		 */
		getSelection: function( widgetId ) {
			var ids, selection;
			ids = $( '#widget-' + widgetId + '-id' ).val();

			if ( ! ids ) {
				return null;
			}

			selection = ids.split( ',' ).reduce( function( list, id ) {
				var attachment = wp.media.attachment( id );
				if ( id && attachment ) {
					list.push( attachment );
				}
				return list;
			}, [] );

			return new wp.media.model.Selection( selection );
		},

		/**
		 * Open media manager.
		 *
		 * @param {jQuery.Event} event Event.
		 * @returns {void}
		 */
		openMediaManager: function( event ) {
			var widgetFrame, widgetId;
			widgetId = $( event.target ).data( 'id' );

			// Create the media frame.
			widgetFrame = wp.media( {
				button: {
					text: translate( 'addToWidget', 'Add to widget' ) // Text of the submit button.
				},

				states: new wp.media.controller.Library( {
					library:    wp.media.query( { type: [ 'image', 'audio', 'video' ] } ),
					title:      translate( 'selectMedia', 'Select Media' ), // Media frame title
					selection:  frame.getSelection( widgetId ),
					multiple:   false,
					priority:   20,
					display:    true, // Attachment display setting
					filterable: 'all'
				} )
			} );

			// Render the attachment details.
			widgetFrame.on( 'select', function() {
				var props, attachment;

				// Only try to render the attachment details if a selection was made.
				if ( widgetFrame.state().get( 'selection' ).length > 0 ) {
					props = widgetFrame.content.get( '.attachments-browser' )
						.sidebar.get( 'display' ).model.toJSON();

					attachment = widgetFrame.state().get( 'selection' ).first().toJSON();

					frame.renderFormView( widgetId, props, attachment );
				}
			} );

			widgetFrame.open( widgetId );
		},

		/**
		 * Renders the attachment details from the media modal into the widget.
		 *
		 * @param {String} widgetId Widget ID.
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 * @returns {void}
		 */
		renderFormView: function( widgetId, props, attachment ) {
			var formView, attachmentJSON;

			// Start with container elements for the widgets page, customizer controls, and customizer preview.
			formView = $( '.' + widgetId + ', #customize-control-widget_' + widgetId + ', #' + widgetId );

			// Bail if there is no target form
			if ( ! formView.length ) {
				return;
			}

			_.extend( attachment, _.pick( props, 'link', 'size' ) );

			// Show/hide the widget description
			formView.find( '.attachment-description' )
				.toggleClass( 'hidden', ! attachment.description )
				.html( attachment.description );

			// Set the preview content and apply responsive styles to the media.
			formView.find( '.media-widget-admin-preview' )
				.html( frame.renderMediaElement( widgetId, props, attachment ) )
				.find( '.wp-video, .wp-caption' ).css( 'width', '100%' ).end()
				.find( 'img.image' ).css( { width: '100%', height: 'auto' } );

			if ( _.contains( [ 'audio', 'video' ], attachment.type ) ) {
				wp.mediaelement.initialize();
			}

			frame.bindEvent( formView );

			// Populate form fields with selection data from the media frame.
			_.each( _.keys( frame.defaultProps ), function( key ) {
				formView.find( '#widget-' + widgetId + '-' + key ).val( attachment[ key ] || props[ key ] ).trigger( 'change' );
			} );

			/*
			 * Force the widget's partial in the preview to refresh even when the instance was not changed.
			 * This ensures that changes to attachment's caption or description will be shown in the
			 * preview since these are not in the widget's instance state.
			 */
			attachmentJSON = JSON.stringify( _.pick( attachment, 'id', 'title', 'caption', 'link', 'size' ) );
			if ( formView.data( 'attachment' ) !== attachmentJSON && wp.customize && wp.customize.previewer ) {
				wp.customize.previewer.send( 'refresh-partial', 'widget[' + widgetId + ']' );
				formView.data( 'attachment', attachmentJSON );
			}

			// Change button text
			formView.find( frame.buttonId ).text( translate( 'changeMedia', 'Change Media' ) );
		},

		/**
		 * Renders the media attachment in HTML.
		 *
		 * @param {String} widgetId Widget ID.
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @returns {String} Render media element.
		 */
		renderMediaElement: function( widgetId, props, attachment ) {
			var type, renderer;
			type = attachment.type || '';
			renderer = 'render' + type.charAt( 0 ).toUpperCase() + type.slice( 1 );

			if ( 'function' === typeof frame[ renderer ] ) {
				return frame[renderer]( widgetId, props, attachment );
			}

			// In case no renderer found
			return '';
		},

		/**
		 * Renders the image attachment
		 *
		 * @param {String} widgetId Widget ID.
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @returns {String} Rendered image.
		 */
		renderImage: function( widgetId, props, attachment ) {
			var image = $( '<img />' )
				.addClass( 'image wp-image' + attachment.id )
				.attr( {
					'data-id': widgetId,
					src:       attachment.sizes[ props.size ].url,
					title:     attachment.title,
					alt:       attachment.alt,
					width:     attachment.sizes[ props.size ].width,
					height:    attachment.sizes[ props.size ].height
				} );

			if ( attachment.caption ) {
				image = $( '<figure />' )
					.width( attachment.sizes[ props.size ].width )
					.addClass( 'wp-caption' )
					.attr( 'id', widgetId + '-caption' )
					.append( image );

				$( '<figcaption class="wp-caption-text" />' ).text( attachment.caption ).appendTo( image );
			}

			return image.wrap( '<div />' ).parent().html();
		},

		/**
		 * Renders the audio attachment.
		 *
		 * @param {String} widgetId Widget ID.
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @returns {String} Rendered audio.
		 */
		renderAudio: function( widgetId, props, attachment ) {
			if ( 'embed' === props.link ) {
				return wp.media.template( 'wp-media-widget-audio' )( {
					model: {
						src:    attachment.url
					}
				} );
			}

			return wp.html.string( {
				tag: 'a',
				content: attachment.title,
				attrs: {
					href: '#'
				}
			} );
		},

		/**
		 * Renders the video attachment.
		 *
		 * @param {String} widgetId Widget ID.
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @returns {String} Rendered video.
		 */
		renderVideo: function( widgetId, props, attachment ) {
			if ( 'embed' === props.link ) {
				return wp.media.template( 'wp-media-widget-video' )( {
					model: {
						src:    attachment.url,
						width:  attachment.width,
						height: attachment.height
					}
				} );
			}

			return wp.html.string( {
				tag: 'a',
				content: attachment.title,
				attrs: {
					href: '#'
				}
			} );
		}
	};

	/**
	 * Translate.
	 *
	 * @param {string} key Key.
	 * @param {string} defaultText Default text.
	 * @return {string} Translated string.
	 */
	function translate( key, defaultText ) {
		return l10n[ key ] || defaultText;
	}

	$( document )
		.ready( frame.init )
		.on( 'widget-added widget-updated', frame.init );

	window.wp = window.wp || {};
	window.wp.MediaWidget = frame;
} )( jQuery, window._mediaWidgetL10n || {} );
