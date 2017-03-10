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
			$( '.button.select-media', context || '.media-widget-preview' )
				.off( 'click.mediaWidget' )
				.on( 'click.mediaWidget', frame.openMediaManager );
			$( '.button.edit-media' )
				.off( 'click.mediaWidget' )
				.on( 'click.mediaWidget', frame.openMediaEditor );
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
		 * Gather meta information about an image.
		 *
		 * @param {Object} image The image to extract data from
		 * @return {{
		 *      align: string,
		 *      attachment_id: boolean|number,
		 *      caption: string,
		 *      customHeight: number,
		 *      customWidth: number,
		 *      extraClasses: string,
		 *      link: boolean,
		 *      linkClassName: string,
		 *      linkTargetBlank: boolean,
		 *      linkUrl: string,
		 *      linkRel: string,
		 *      size: string,
		 *      title: string
		 *  }}
		 */
		extractImageData: function( image ) {
			var classes, extraClasses, metadata, captionBlock, caption, link, width, height,
				captionClassName = [],
				isIntRegExp = /^\d+$/;

			// Default attributes.
			metadata = {
				align: 'none',
				attachment_id: false,
				caption: '',
				extraClasses: '',
				link: false,
				linkClassName: '',
				linkTargetBlank: false,
				linkUrl: '',
				linkRel: '',
				size: 'custom',
				title: ''
			};

			metadata.alt   = image.attr( 'alt' );
			metadata.title = image.attr( 'title' );
			metadata.url   = image.attr( 'src' );

			height = image.attr( 'height' );
			width  = image.attr( 'width' );

			if ( ! isIntRegExp.test( height ) || parseInt( height, 10 ) < 1 ) {
				height = image.naturalHeight || image.height;
			}

			if ( ! isIntRegExp.test( width ) || parseInt( width, 10 ) < 1 ) {
				width = image.naturalWidth || image.width;
			}

			metadata.customHeight = metadata.height = height;
			metadata.customWidth  = metadata.width = width;

			classes = image.attr( 'class' ).split( ' ' );
			extraClasses = [];

			_.each( classes, function( name ) {
				if ( /^wp-image/.test( name ) ) {
					metadata.attachment_id = parseInt( name.replace( 'wp-image-', '' ), 10 );
				} else if ( /^align/.test( name ) ) {
					metadata.align = name.replace( 'align', '' );
				} else if ( /^size/.test( name ) ) {
					metadata.size = name.replace( 'size-', '' );
				} else {
					extraClasses.push( name );
				}
			} );

			metadata.extraClasses = extraClasses.join( ' ' );

			// Extract caption
			captionBlock = image.parents( '.wp-caption' );

			if ( captionBlock.length ) {
				classes = captionBlock.attr( 'class' ).split( ' ' );
				_.each( classes, function( name ) {
					if ( /^align/.test( name ) ) {
						metadata.align = name.replace( 'align', '' );
					} else if ( name && 'wp-caption' !== name ) {
						captionClassName.push( name );
					}
				} );

				metadata.captionClassName = captionClassName.join( ' ' );

				caption = $( '.wp-caption-text', captionBlock );
				if ( caption.length ) {
					metadata.caption = caption.text()
						.replace( /<br[^>]*>/g, '$&\n' )
						.replace( /^<p>/, '' )
						.replace( /<\/p>$/, '' );
				}
			}

			// Extract linkTo
			link = image.parent( 'a' );
			if ( link.length ) {
				metadata.link = true;
				metadata.linkUrl = link.prop( 'href' );
				metadata.linkTargetBlank = '_blank' === link.prop( 'target' );
				metadata.linkRel = link.attr( 'rel' );
				metadata.linkClassName = link.attr( 'class' );
			}

			return metadata;
		},

		/**
		 * Open the media modal in the edit media state.
		 *
		 * @param {jQuery.Event} event Event.
		 * @returns {void}
		 */
		openMediaEditor: function( event ) {
			var $button = $( event.target ),
				widgetId = $button.data( 'id' ),
				widgetFrame, callback,
				widgetContent = $button.closest( '.widget-content' ),
				$image = widgetContent.find( '.image' ),
				metadata = frame.extractImageData( $image );

			// Set media to the edit mode.
			wp.media.events.trigger( 'editor:image-edit', {
				metadata: metadata,
				image: $image
			} );

			// Set up the media frame.
			widgetFrame = wp.media({
				frame: 'image',
				state: 'image-details',
				metadata: metadata
			} );

			// Create a callback function for the mediaFrame.
			callback = function( imageData ) {

				// @todo Changing the ID is not causing the image to update.
				widgetContent.find( '.id' ).val( imageData.attachment_id ).trigger( 'change' );

				widgetContent.find( '.align' ).val( imageData.align ).trigger( 'change' );
				widgetContent.find( '.link' ).val( imageData.link ).trigger( 'change' );
				widgetContent.find( '.link_url' ).val( imageData.linkUrl ).trigger( 'change' );
				widgetContent.find( '.size' ).val( imageData.size ).trigger( 'change' );

				// Set the new data on the image.
				widgetFrame.detach();
			};

			widgetFrame.state( 'image-details' ).on( 'update', callback );
			widgetFrame.state( 'replace-image' ).on( 'replace', callback );
			widgetFrame.on( 'close', function() {
				widgetFrame.detach();
			});

			widgetFrame.open( widgetId );
		},

		/**
		 * Open media manager.
		 *
		 * @param {jQuery.Event} event Event.
		 * @returns {void}
		 */
		openMediaManager: function( event ) {
			var $button = $( event.target ),
				widgetId = $button.data( 'id' ),
				selection = frame.getSelection( widgetId ),
				widgetFrame, prevAttachmentId;

			if ( selection && selection.length > 0 ) {
				prevAttachmentId = selection.first().get( 'id' );
			}

			// Create the media frame.
			widgetFrame = wp.media( {
				button: {
					text: translate( 'addToWidget', 'Add to widget' ) // Text of the submit button.
				},

				states: new wp.media.controller.Library( {
					library:    wp.media.query( { type: $button.data( 'type' ) } ),
					title:      translate( 'selectMedia', 'Select Media' ), // Media frame title
					selection:  selection,
					multiple:   false,
					priority:   20,
					display:    true, // Attachment display setting
					filterable: false
				} )
			} );

			// Render the attachment details.
			widgetFrame.on( 'select', function() {
				var attachment, props;

				attachment = frame.getFirstAttachment( widgetFrame );
				props = frame.getDisplayProps( widgetFrame );

				// Only try to render the attachment details if a selection was made.
				if ( props && attachment && prevAttachmentId !== attachment.id ) {
					frame.renderFormView( widgetId, props, attachment );
				}
			} );

			/*
			 * Try to render the form only if the selection doesn't change.
			 * This ensures that changes of props will reflect in the form and the preview
			 * even when user doesn't click the Add button.
			 */
			widgetFrame.on( 'close', function() {
				var attachment, props;

				attachment = frame.getFirstAttachment( widgetFrame );

				if ( attachment && prevAttachmentId && prevAttachmentId === attachment.id ) {
					props = frame.getDisplayProps( widgetFrame );
					frame.renderFormView( widgetId, props, attachment );
				}
			} );

			widgetFrame.open( widgetId );
		},

		/**
		 * Get the first attachment of the selection in the widget frame.
		 *
		 * @param {wp.media.view.MediaFrame} widgetFrame Widget frame
		 * @return {object|null} JSON object of the attachment if it exists, otherwise null
		 */
		getFirstAttachment: function( widgetFrame ) {
			var selection = widgetFrame.state().get( 'selection' );

			if ( 0 === selection.length ) {
				return null;
			}

			return selection.first().toJSON();
		},

		/**
		 * Get display props of the current selection from the widget frame.
		 *
		 * @param {wp.media.view.MediaFrame} widgetFrame Widget frame
		 * @return {object|null} JSON object of the props if possible, otherwise null
		 */
		getDisplayProps: function( widgetFrame ) {
			if ( 0 === widgetFrame.state().get( 'selection' ).length ) {
				return null;
			}

			return widgetFrame.content.get( '.attachments-browser' ).sidebar.get( 'display' ).model.toJSON();
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
			var formView, serializedAttachment;

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
				.find( '.wp-video' ).css( 'width', '100%' ).end();

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
			serializedAttachment = JSON.stringify( _.pick( attachment, 'id', 'title', 'caption', 'link', 'size' ) );
			if ( formView.data( 'attachment' ) !== serializedAttachment && wp.customize && wp.customize.previewer ) {
				wp.customize.previewer.send( 'refresh-partial', 'widget[' + widgetId + ']' );
				formView.data( 'attachment', serializedAttachment );
			}

			// Change button text
			formView.find( '.select-media' ).text( translate( 'changeMedia', 'Change Media' ) );

			// Add a class to the container, showing the edit button.
			formView.addClass( 'has-attachment' );
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

			// @todo The image size in the control should always be full. Only the preview should get the actual selected size.
			var image = $( '<img />' )
				.addClass( 'image wp-image-' + attachment.id )
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
