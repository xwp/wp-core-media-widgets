

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

		id_base: '',

		mime_type: '',

		events: {
			'click .select-media': 'selectMedia'
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
			control.attachment = new wp.media.model.Attachment();
			if ( control.model.get( 'attachment_id' ) ) {
				control.attachment.set( { id: control.model.get( 'attachment_id' ) } );
				control.attachment.fetch().done( function() {
					control.attachmentFetched.resolve();
				} );
			}

			// @todo We may need to do this based on whether or not the modal sends back all the required fields.
			// control.model.on( 'change:attachment_id', function( id ) {
			// 	control.attachment.set( { id: id } );
			// 	control.attachment.fetch();
			// } );

			// @todo 2-way binding of model title to input title.
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
			var control = this;
			if ( ! control.rendered ) {
				control.$el.html( control.template( control.model.attributes ) );
				control.rendered = true;
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
		 *
		 */
		selectMedia: function() {

			// @todo
			return;

			var control = this;
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
		}

	} );

	component.MediaWidgetModel = Backbone.Model.extend( {
		defaults: {
			title: '',
			attachment_id: 0
		}
	} );

	// The image-specific classes should be placed into a separate file.
	component.ImageWidgetModel = component.MediaWidgetModel.extend( {} );
	component.ImageWidgetControl = component.MediaWidgetControl.extend( {
		renderPreview: function() {
			var control = this, previewContainer, previewTemplate;
			previewContainer = control.$el.find( '.media-widget-preview .rendered' );
			previewTemplate = wp.template( 'wp-media-widget-image-preview' );
			previewContainer.html( previewTemplate( { attachment: control.attachment.attributes } ) );
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
			modelAttributes[ input.data( 'property' ) ] = JSON.parse( input.val() );
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
