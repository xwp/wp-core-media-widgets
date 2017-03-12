

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

		/**
		 *
		 * @param {object} options
		 * @param {string} options.id Widget ID.
		 */
		initialize: function( options ) {

		}

	} );

	component.MediaWidgetModel = Backbone.Model.extend( {} );

	// The image-specific classes should be placed into a separate file.
	component.ImageWidgetModel = component.MediaWidgetModel.extend( {} );
	component.ImageWidgetControl = component.MediaWidgetControl.extend( {

	} );
	component.controlConstructors.media_image = component.ImageWidgetControl;
	component.modelConstructors.media_image = component.ImageWidgetModel;

	// @todo Collection for control views?
	// component.controlCollection = new (Backbone.Collection.extend( {
	// 	model: component.MediaWidgetControl
	// } ));
	component.widgetControls = {};

	// component.registerWidget = function registerWidget( Control ) {
	//
	// };

	$( document ).on( 'widget-added', function( event, widgetContainer ) {
		console.info( widgetContainer )
		var widgetContent, controlContainer, widgetForm, widgetId, idBase, ControlConstructor, ModelConstructor, modelAttributes, control, model;
		widgetForm = widgetContainer.find( '> .widget-inside > .form' );
		widgetContent = widgetForm.find( '> .widget-content' );
		idBase = widgetForm.find( '> .id_base' ).val();

		ControlConstructor = component.controlConstructors[ idBase ];
		if ( ! ControlConstructor ) {
			return;
		}

		ModelConstructor = component.modelConstructors[ idBase ] || component.MediaWidgetModel;

		widgetId = widgetForm.find( '> .widget-id' ).val();
		controlContainer = $( '<div>CONTROL</div>' );
		widgetContent.before( controlContainer );
		modelAttributes = {
			id: widgetId
		};
		widgetContent.find( '.media-widget-instance-property' ).each( function() {
			var input = $( this );
			modelAttributes[ input.data( 'property' ) ] = JSON.parse( input.val() );
		} );

		control = new ControlConstructor( {
			id: widgetId,
			el: controlContainer,
			model: new ModelConstructor( modelAttributes )
		} );

		// @todo Register model?
		component.widgetControls[ widgetId ] = control;
	} );

	// @todo When widget-updated and widget-synced, make sure properties in model are updated.

	return component;
} )( jQuery );
