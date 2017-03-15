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
				if ( ! control.id_base ) {
					throw new Error( 'Missing id_base.' );
				}
			}

			control.attachmentFetched = $.Deferred();
			control.selectedAttachment = new wp.media.model.Attachment();
			if ( control.model.get( 'attachment_id' ) ) {
				control.selectedAttachment.set( {
					id: control.model.get( 'attachment_id' )
				} );
				control.selectedAttachment.fetch().done( function() {
					control.attachmentFetched.resolve();
				} );
			}

			/*
			 * Sync the widget instance model attributes onto the hidden inputs that widgets currently use to store the state.
			 * In the future, when widgets are JS-driven, the underlying widget instance data should be exposed as a model
			 * from the start, without having to sync with hidden fields. See <https://core.trac.wordpress.org/ticket/33507>.
			 */
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

				control.render();
			} );

			// Re-render the preview when the attachment changes.
			control.listenTo( control.selectedAttachment, 'change', function() {
				control.attachmentFetched.resolve();
				control.render();
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
		schema: {
			title: {
				type: 'string',
				'default': ''
			},
			attachment_id: {
				type: 'integer',
				'default': 0
			},
			url: {
				type: 'string',
				'default': ''
			}
		},

		/**
		 * Get default attribute values.
		 *
		 * @returns {object} Default values.
		 */
		defaults: function() {
			var defaults = {};
			_.each( this.schema, function( fieldSchema, field ) {
				defaults[ field ] = fieldSchema['default'];
			} );
			return defaults;
		},

		/**
		 * Set attribute value(s).
		 *
		 * This is a wrapped version of Backbone.Model#set() which allows us to
		 * cast the attribute values from the hidden inputs' string values into
		 * the appropriate data types (integers or booleans).
		 *
		 * @param {string|object} key       Attribute name or attribute pairs.
		 * @param {mixed|object}  [val]     Attribute value or options object.
		 * @param {object}        [options] Options when attribute name and value are passed separately.
		 * @return {wp.mediaWidgets.MediaWidgetModel} This model.
		 */
		set: function set( key, val, options ) {
			var model = this, attrs, opts, castedAttrs; // eslint-disable-line consistent-this
			if ( null === key ) {
				return model;
			}
			if ( 'object' === typeof key ) {
				attrs = key;
				opts = val;
			} else {
				attrs = {};
				attrs[ key ] = val;
				opts = options;
			}

			castedAttrs = {};
			_.each( attrs, function( value, name ) { // eslint-disable-line complexity
				var type;
				if ( ! model.schema[ name ] ) {
					return;
				}
				type = model.schema[ name ].type;
				if ( 'integer' === type ) {
					castedAttrs[ name ] = parseInt( value, 10 );
				} else if ( 'boolean' === type ) {
					castedAttrs[ name ] = ! ( ! value || '0' === value || 'false' === value );
				} else {
					castedAttrs[ name ] = value;
				}
			} );

			return Backbone.Model.prototype.set.call( this, castedAttrs, opts );
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

		/*
		 * Sync the widget instance model attributes onto the hidden inputs that widgets currently use to store the state.
		 * In the future, when widgets are JS-driven, the underlying widget instance data should be exposed as a model
		 * from the start, without having to sync with hidden fields. See <https://core.trac.wordpress.org/ticket/33507>.
		 */
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
