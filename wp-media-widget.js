/**
 * @since 4.8.0
 *
 * @package WP_Media_Widget
 */
( function ( $ ) {
	var frame, widgetFrame;

	function translate( key, defaultText ) {
		return ( window._mediaWidgetl10n && _mediaWidgetl10n[ key ] ) || defaultText;
	}

	frame = {
		buttonId: '.media-widget-preview .button',

		defaultProps: {
			id:    '',
			align: '',
			size:  '',
			link:  '',
		},

		init: function() {
			$( frame.buttonId )
				.off( 'click.mediaWidget' )
				.on( 'click.mediaWidget', frame.openMediaManager );

			frame.bindImageClick();

			wp.mediaelement.initialize();
		},

		bindImageClick: function() {
			$( '.media-widget-preview .image' )
				.off( 'click.mediaWidget' )
				.on( 'click.mediaWidget', frame.openMediaManager );
		},

		openMediaManager: function( event ) {
			event.preventDefault();
			var widgetId = $( event.target ).data( 'id' );

			// Create the media frame.
			widgetFrame = wp.media( {
				button: {
					text: translate( 'add-to-widget', 'Add to widget' ), // Text of the submit button.
				},

				states: new wp.media.controller.Library( {
					library:    wp.media.query(),
					title:      translate( 'select-media', 'Select Media' ), // Media frame title
					multiple:   false,
					priority:   20,
					display:    true, // attachment display setting
					filterable: 'all',
				} ),
			} );

			// Populate previously selected media when the media frame is opened.
			widgetFrame.on( 'open', function() {
				var selection = widgetFrame.state().get( 'selection' ),
					ids = $( '#widget-' + widgetId + '-id' ).val().split(',');

				if ( ids[0] > 0 ) {
					ids.forEach( function( id ) {
						var attachment = wp.media.attachment( id );
						attachment.fetch();
						selection.add( attachment ? [ attachment ] : [] );
					} );
				}
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

			// The widget title bar doesn't update automatically on the Appearance > Widgets page. This fixes that problem.
			formView.closest( '.widget' ).find( '.in-widget-title' ).html( ': ' + attachment.title );

			formView.find( '.attachment-description' )
				[ attachment.description ? 'removeClass' : 'addClass' ]('hidden')
				.html( attachment.description );

			extras = formView.find( '.extras' );
			// Display a preview of the image in the widgets page and customizer controls.
			extras.removeClass( 'hidden' );

			attachment.link = props.link;
			attachment.size = props.size;

			previewEl = formView.find( '.media-widget-admin-preview' );
			if ( ! previewEl.length ) {
				previewEl = $( '<div class="media-widget-admin-preview />' ).insertBefore( extras );
			}
			previewEl.html( frame.renderMediaElement( widgetId, props, attachment ) );

			if ( scale.prop( 'checked' ) ) {
				previewEl
					.find( '.wp-video, .wp-caption' ).css( 'width', '100%' ).end()
					.find( 'img.image' ).css( { width: '100%', height: 'auto' } );
			}

			if ( -1 < $.inArray( attachment.type, [ 'audio', 'video' ] ) ) {
				wp.mediaelement.initialize();
			} else if ( 'image' === attachment.type ) {
				frame.bindImageClick();
			}

			// Populate form fields with selection data from the media frame.
			_.each( _.keys( frame.defaultProps ), function ( key ) {
				formView.find( '#widget-' + widgetId + '-' + key ).val( attachment[ key ] || props[ key ] ).trigger( 'change' );
			} );

			// Trigger a sync to update the widget in the customizer preview.
			formView.find( '#widget-' + widgetId + '-url' ).trigger( 'change' );

			// Change button text
			formView.find( frame.buttonId ).text( translate( 'change-media', 'Change Media' ) );
		},

		/**
		 * Renders the media attachment in HTML.
		 *
		 * @param {String} widgetId
		 * @param {Object} props Attachment Display Settings (align, link, size, etc).
		 * @param {Object} attachment Attachment Details (title, description, caption, url, sizes, etc).
		 */
		renderMediaElement: function( widgetId, props, attachment ) {
			var image;

			if ( 'image' === attachment.type ) {
				image = $( '<img />' )
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
			}

			if ( 'audio' === attachment.type ) {
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
			}

			if ( 'video' === attachment.type ) {
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

			// Unknown media type
			return '';
		}
	};

	$( document )
		.ready( frame.init )
		.on( 'widget-added widget-updated', frame.init );

	window.wp = window.wp || {};
	window.wp.MediaWidget = frame;
} )( jQuery );
