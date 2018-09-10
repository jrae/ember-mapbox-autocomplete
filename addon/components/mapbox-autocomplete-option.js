import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'li',
  classNames: 'ember-autocomplete-option',
  classNameBindings: Ember.String.w('isFocused:active'),

  index: null,
  'on-click': null,
  isFocused: false,

  didClick: Ember.on('click', function() {
    this.get('on-click')(this.get('index'));
  })
});
