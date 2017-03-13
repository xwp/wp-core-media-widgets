

wp.mediaWidgets = ( function( $ ) {
	'use strict';

	var component = {};

	// Media widget subclasses assign subclasses of MediaWidgetControl onto this object by widget ID base.
	component.controlConstructors = {};

	// ???
	component.modelConstructors = {};

	/**
	 * Media widget control.
	 *
	 * @constructor
	 * @abstract
	 */
	component.MediaWidgetControl = Backbone.View.extend( {

		l10n: {
			add_to_widget: '{{add_to_widget}}',
			select_media: '{{select_media}}'
		},

		id_base: '',

		mime_type: '',

		events: {
			'click .select-media': 'selectMedia',
			'click .edit-media': 'editMedia'
		},

		/**
		 * Initialize.
		 *
		 * @param {object}         options - Options.
		 * @param {Backbone.Model} options.model - Model.
		 * @param {function}       options.template - Control template.
		 * @param {jQuery}         options.el - Control container element.
		 */
		initialize: function( options ) {
			var control = this;

			Backbone.View.prototype.initialize.call( control, options );

			if ( ! control.id_base ) {
				_.find( component.controlConstructors, function( Constructor, id_base ) {
					if ( control instanceof Constructor ) {
						control.id_base = id_base;
						return true;
					}
					return false;
				} );
				if ( ! control.id_base ) {
					throw new Error( 'Missing id_base.' );
				}
			}

			control.attachmentFetched = $.Deferred();
			control.selectedAttachment = new wp.media.model.Attachment();
			if ( control.model.get( 'attachment_id' ) ) {
				control.selectedAttachment.set( { id: control.model.get( 'attachment_id' ) } );
				control.selectedAttachment.fetch().done( function() {
					control.attachmentFetched.resolve();
				} );
			}

			// Sync the widget instance model attributes onto the hidden inputs that widgets currently use to store the state.
			control.listenTo( control.model, 'change', function() {
				control.$el.next( '.widget-content' ).find( '.media-widget-instance-property' ).each( function() {
					var input = $( this ), value;
					value = control.model.get( input.data( 'property' ) );
					if ( _.isUndefined( value ) ) {
						return;
					}
					value = String( value );
					if ( input.val() === value ) {
						return;
					}
					console.info( input.data( 'property' ), input.val(), '=>', value )
					input.val( value );
					input.trigger( 'change' );
				} );
			} );

			// Re-render the preview when the attachment changes.
			control.listenTo( control.selectedAttachment, 'change', function() {
				control.renderPreview();
			} );

			// Update the title.
			control.$el.on( 'input', '.title', function() {
				control.model.set( {
					title: $.trim( $( this ).val() )
				} );
			} );

			// @todo Make sure that updates to the hidden inputs sync back to the model.
		},

		/**
		 * Get template.
		 *
		 * @return {Function} Template.
		 */
		template: function() {
			var control = this;
			if ( ! $( '#tmpl-widget-media-' + control.id_base + '-control' ).length ) {
				throw new Error( 'Missing widget control template for ' + control.id_base );
			}
			return wp.template( 'widget-media-' + control.id_base + '-control' );
		},

		/**
		 * Render template.
		 *
		 * @returns {void}
		 */
		render: function() {
			var control = this, titleInput;

			if ( ! control.templateRendered ) {
				control.$el.html( control.template( control.model.attributes ) );
				control.templateRendered = true;
			}

			titleInput = control.$el.find( '.title' );
			if ( ! titleInput.is( document.activeElement ) ) {
				titleInput.val( control.model.get( 'title' ) );
			}

			control.attachmentFetched.done( function() {
				control.renderPreview();
			} );

			control.$el.toggleClass( 'selected', control.isSelected() );
		},

		/**
		 * Render media preview.
		 *
		 * @abstract
		 */
		renderPreview: function() {
			throw new Error( 'renderPreview must be implemented' );
		},

		/**
		 * Whether a media item is selected.
		 *
		 * @return {boolean}
		 */
		isSelected: function() {
			var control = this;
			return Boolean( control.model.get( 'attachment_id' ) || control.model.get( 'url' ) );
		},

		/**
		 * Open the media select frame to chose an item.
		 *
		 * @abstract
		 */
		selectMedia: function() {
			throw new Error( 'selectMedia not implemented' );
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame Select frame.
		 * @return {object}
		 */
		getSelectFrameProps: function( mediaFrame ) {
			var attachment ,props;

			attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
			if ( _.isEmpty( attachment ) ) {
				return {};
			}

			props = {
				attachment_id: attachment.id,
				url: attachment.url
			};

			return props;
		},

		/**
		 * Open the media image-edit frame to modify the selected item.
		 *
		 * @abstract
		 */
		editMedia: function() {
			throw new Error( 'editMedia not implemented' );
		}
	} );

	component.MediaWidgetModel = Backbone.Model.extend( {
		defaults: {
			title: '',
			attachment_id: 0,
			url: ''
		}
	} );

	// The image-specific classes should be placed into a separate file.
	component.ImageWidgetModel = component.MediaWidgetModel.extend( {} );
	component.ImageWidgetControl = component.MediaWidgetControl.extend( {
		renderPreview: function() {
			var control = this, previewContainer, previewTemplate;
			previewContainer = control.$el.find( '.media-widget-preview .rendered' );
			previewTemplate = wp.template( 'wp-media-widget-image-preview' );
			previewContainer.html( previewTemplate( { attachment: control.selectedAttachment.attributes } ) );
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame Select frame.
		 * @return {object}
		 */
		getSelectFrameProps: function( mediaFrame ) {
			var attachment, displaySettings, props;

			attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
			if ( _.isEmpty( attachment ) ) {
				return {};
			}

			displaySettings = mediaFrame.content.get( '.attachments-browser' ).sidebar.get( 'display' ).model.toJSON();

			props = {
				attachment_id: attachment.id,
				url: attachment.url,
				size: displaySettings.size,
				width: 0, // Reset.
				height: 0, // Reset.
				align: displaySettings.align,
				caption: attachment.caption,
				alt: attachment.alt,
				link_type: displaySettings.link,
				link_url: displaySettings.link_url
			};

			return props;
		},

		/**
		 * Open the media select frame to chose an item.
		 */
		selectMedia: function() {
			var control = this, selection, mediaFrame;

			selection = new wp.media.model.Selection( [ control.model.get( 'attachment_id' ) ] );

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

				// Update cached attachment object to avoid having to re-fetch.
				attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
				control.selectedAttachment.set( attachment );

				// Update widget instance.
				control.model.set( control.getSelectFrameProps( mediaFrame ) );
			} );

			mediaFrame.open();
		},

		/**
		 * Open the media image-edit frame to modify the selected item.
		 */
		editMedia: function() {
			var control = this, mediaFrame, metadata, updateCallback;

			metadata = {
				attachment_id: control.model.get( 'attachment_id' ),
				align: control.model.get( 'align' ),
				link: control.model.get( 'link_type' ),
				linkUrl: control.model.get( 'link_url' ),
				size: control.model.get( 'size' ),
				caption: control.model.get( 'caption' ),
				alt: control.model.get( 'alt' ),
				extraClasses: control.model.get( 'image_classes' ),
				linkClassName: control.model.get( 'link_classes' ),
				linkRel: control.model.get( 'link_rel' ),
				linkTargetBlank: control.model.get( 'link_target_blank' ),
				title: control.model.get( 'image_title' ),
				customWidth: control.model.get( 'width' ),
				customHeight: control.model.get( 'height' ),
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
				var attachment;

				control.model.set( {
					attachment_id: imageData.attachment_id,
					url: imageData.url,
					align: imageData.align,
					link_type: imageData.link,
					link_url: imageData.linkUrl,
					size: imageData.size,
					caption: imageData.caption,
					alt: imageData.alt,
					image_classes: imageData.extraClasses,
					link_classes: imageData.linkClassName,
					link_rel: imageData.linkRel,
					link_target_blank: imageData.linkTargetBlank,
					image_title: imageData.title,
					width: 'custom' === imageData.size ? imageData.customWidth : imageData.width,
					height: 'custom' === imageData.size ? imageData.customHeight : imageData.height
				} );

				// Update cached attachment object to avoid having to re-fetch.
				attachment = mediaFrame.state().get( 'selection' ).first().toJSON();
				control.selectedAttachment.set( attachment );
			};

			mediaFrame.state( 'image-details' ).on( 'update', updateCallback );
			mediaFrame.state( 'replace-image' ).on( 'replace', updateCallback );
			mediaFrame.on( 'close', function() {
				mediaFrame.detach();
			});

			mediaFrame.open();
		}
	} );
	component.controlConstructors.media_image = component.ImageWidgetControl;
	component.modelConstructors.media_image = component.ImageWidgetModel;

	// @todo Collection for control views?
	component.modelCollection = new (Backbone.Collection.extend( {
		model: component.MediaWidgetModel
	} ))();
	component.widgetControls = {};

	$( document ).on( 'widget-added', function( event, widgetContainer ) {
		var widgetContent, controlContainer, widgetForm, widgetId, idBase, ControlConstructor, ModelConstructor, modelAttributes, control, model;
		widgetForm = widgetContainer.find( '> .widget-inside > .form' );
		widgetContent = widgetForm.find( '> .widget-content' );
		idBase = widgetForm.find( '> .id_base' ).val();

		ControlConstructor = component.controlConstructors[ idBase ];
		if ( ! ControlConstructor ) {
			return;
		}

		ModelConstructor = component.modelConstructors[ idBase ] || component.MediaWidgetModel;

		// @todo Warning: One of the fields must have the 'title' name, and the value must be a bare string for the sake of populating the widget title.
		widgetId = widgetForm.find( '> .widget-id' ).val();
		controlContainer = $( '<div class="media-widget-control"></div>' );
		widgetContent.before( controlContainer );
		modelAttributes = {
			id: widgetId
		};
		widgetContent.find( '.media-widget-instance-property' ).each( function() {
			var input = $( this );
			modelAttributes[ input.data( 'property' ) ] = input.val();
		} );

		model = new ModelConstructor( modelAttributes );

		control = new ControlConstructor( {
			// @todo Not: id: widgetId,
			el: controlContainer,
			model: model
		} );
		control.render();

		// @todo Sync the properties from the inputs into the model upon widget-synced and widget-updated?
		// @todo There is no widget-removed event.
		component.modelCollection.add( [ model ] );

		// @todo Register model?
		component.widgetControls[ widgetId ] = control;
	} );

	// @todo When widget-updated and widget-synced, make sure properties in model are updated.

	return component;
} )( jQuery );
