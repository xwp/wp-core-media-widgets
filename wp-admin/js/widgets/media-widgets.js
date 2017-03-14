/* eslint consistent-this: [ "error", "control" ] */
wp.mediaWidgets = ( function( $ ) {
	'use strict';

	var component = {};

	// Media widget subclasses assign subclasses of MediaWidgetControl onto this object by widget ID base.
	component.controlConstructors = {};
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
		 * @returns {void}
		 */
		initialize: function initialize( options ) {
			var control = this;

			Backbone.View.prototype.initialize.call( control, options );

			if ( ! control.id_base ) {
				_.find( component.controlConstructors, function( Constructor, idBase ) {
					if ( control instanceof Constructor ) {
						control.id_base = idBase;
						return true;
					}
					return false;
				} );
				if ( ! control.idBase ) {
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
		template: function template() {
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
		render: function render() {
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
		 * @returns {void}
		 */
		renderPreview: function renderPreview() {
			throw new Error( 'renderPreview must be implemented' );
		},

		/**
		 * Whether a media item is selected.
		 *
		 * @return {boolean} Whether selected.
		 */
		isSelected: function isSelected() {
			var control = this;
			return Boolean( control.model.get( 'attachment_id' ) || control.model.get( 'url' ) );
		},

		/**
		 * Open the media select frame to chose an item.
		 *
		 * @abstract
		 * @returns {void}
		 */
		selectMedia: function selectMedia() {
			throw new Error( 'selectMedia not implemented' );
		},

		/**
		 * Get the instance props from the media selection frame.
		 *
		 * @param {wp.media.view.MediaFrame.Select} mediaFrame Select frame.
		 * @return {object} Props.
		 */
		getSelectFrameProps: function getSelectFrameProps( mediaFrame ) {
			var attachment, props;

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
		 * @returns {void}
		 */
		editMedia: function editMedia() {
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

	component.modelCollection = new ( Backbone.Collection.extend( {
		model: component.MediaWidgetModel
	} ) )();
	component.widgetControls = {};

	$( document ).on( 'widget-added', function( event, widgetContainer ) {
		var widgetContent, controlContainer, widgetForm, widgetId, idBase, ControlConstructor, ModelConstructor, modelAttributes, widgetControl, model;
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

		widgetControl = new ControlConstructor( {
			el: controlContainer,
			model: model
		} );
		widgetControl.render();

		// @todo Sync the properties from the inputs into the model upon widget-synced and widget-updated?
		// @todo There is no widget-removed event.
		component.modelCollection.add( [ model ] );

		// @todo Register model?
		component.widgetControls[ widgetId ] = widgetControl;
	} );

	// @todo When widget-updated and widget-synced, make sure properties in model are updated.

	return component;
} )( jQuery );
