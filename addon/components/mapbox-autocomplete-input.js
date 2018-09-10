import Ember from 'ember';

export default Ember.TextField.extend({
  valueDidChange: Ember.on('input', function() {
    this.get('on-change')(this.$().val());
  })
});
