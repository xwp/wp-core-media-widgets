/**
 * @since 4.8.0
 *
 * @package WP_Media_Widget
 */
( function ( $, l10n ) {
	var frame = {
		defaultProps: {
			id:    '',
			align: '',
			size:  '',
			link:  '',
		},

		init: function() {
			frame.bindEvent();
			wp.mediaelement.initialize();
		},

		bindEvent: function( context ) {
			$( '.button.select-media, .image', context || '.media-widget-preview' )
				.off( 'click.mediaWidget' )
				.on( 'click.mediaWidget', frame.openMediaManager );
		},

		/**
		 * Get current selection of media
		 *
		 * @param {String} widgetId
		 * @return {wp.media.models.Selection|null}
		 */
		getSelection: function( widgetId ) {
			var ids = $( '#widget-' + widgetId + '-id' ).val();

			if ( ! ids ) {
				return null;
			}

			var selection = ids.split(',').reduce( function( list, id ) {
				var attachment = wp.media.attachment( id );
				if ( id && attachment ) {
					list.push( attachment );
				}
				return list;
			}, [] );

			return new wp.media.model.Selection( selection );
		},

		openMediaManager: function( event ) {
			var widgetId = $( event.target ).data( 'id' );

			// Create the media frame.
			var widgetFrame = wp.media( {
				button: {
					text: translate( 'addToWidget', 'Add to widget' ), // Text of the submit button.
				},

				states: new wp.media.controller.Library( {
					library:    wp.media.query(),
					title:      translate( 'selectMedia', 'Select Media' ), // Media frame title
					selection:  frame.getSelection( widgetId ),
					multiple:   false,
					priority:   20,
					display:    true, // attachment display setting
					filterable: 'all',
				} ),
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
		 * @param {String} widgetId
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 */
		renderFormView: function( widgetId, props, attachment ) {
			// Start with container elements for the widgets page, customizer controls, and customizer preview.
			var previewEl,
				extras,
				formView = $( '.' + widgetId + ', #customize-control-widget_' + widgetId + ', #' + widgetId ),
				scale = $( '#widget-' + widgetId + '-scale' );

			// Bail if there is no target form
			if ( ! formView.length || ! scale.length ) {
				return;
			}

			_.extend( attachment, _.pick( props, 'link', 'size' ) );

			// Show/hide the widget description
			formView.find( '.attachment-description' )
				.toggleClass( 'hidden', ! attachment.description )
				.html( attachment.description );

			// Display a preview of the image in the widgets page and customizer controls.
			extras = formView.find( '.extras' ).removeClass( 'hidden' );

			// Set the preview content
			previewEl = formView.find( '.media-widget-admin-preview' );
			previewEl.html( frame.renderMediaElement( widgetId, props, attachment ) );

			// Apply responsive styles to the media if the scale option is checked
			if ( scale.prop( 'checked' ) ) {
				previewEl
					.find( '.wp-video, .wp-caption' ).css( 'width', '100%' ).end()
					.find( 'img.image' ).css( { width: '100%', height: 'auto' } );
			}

			if ( _.contains( [ 'audio', 'video' ], attachment.type ) ) {
				wp.mediaelement.initialize();
			}

			frame.bindEvent( formView );

			// Populate form fields with selection data from the media frame.
			_.each( _.keys( frame.defaultProps ), function ( key ) {
				formView.find( '#widget-' + widgetId + '-' + key ).val( attachment[ key ] || props[ key ] ).trigger( 'change' );
			} );

			// Trigger a sync to update the widget in the customizer preview.
			formView.find( '#widget-' + widgetId + '-url' ).trigger( 'change' );

			// Change button text
			formView.find( frame.buttonId ).text( translate( 'changeMedia', 'Change Media' ) );
		},

		/**
		 * Renders the media attachment in HTML.
		 *
		 * @param {String} widgetId
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @return {String}
		 */
		renderMediaElement: function( widgetId, props, attachment ) {
			var type = attachment.type || '';
			var renderer = 'render' + type.charAt(0).toUpperCase() + type.slice(1);

			if ( 'function' === typeof frame[renderer] ) {
				return frame[renderer]( widgetId, props, attachment );
			}

			// In case no renderer found
			return '';
		},

		/**
		 * Renders the image attachment
		 *
		 * @param {String} widgetId
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @return {String}
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
		 * Renders the audio attachment
		 *
		 * @param {String} widgetId
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @return {String}
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
		 * Renders the video attachment
		 *
		 * @param {String} widgetId
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 *
		 * @return {String}
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

	function translate( key, defaultText ) {
		return l10n[ key ] || defaultText;
	}

	$( document )
		.ready( frame.init )
		.on( 'widget-added widget-updated', frame.init );

	window.wp = window.wp || {};
	window.wp.MediaWidget = frame;
} )( jQuery, window._mediaWidgetL10n || {} );
