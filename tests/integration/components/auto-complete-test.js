import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const locations = Ember.A([
  Ember.Object.create({
    id: 'place.9962989141465270', index: 0,
    place_name: "São Paulo, São Paulo, Brazil", text: 'São Paulo',
    lat: -46.6334, long: -23.5507}),
  Ember.Object.create({
    id: 'place.9962989141465271', index: 0,
    place_name: "Santiago Metropolitan, Chile", text: 'Santiago Metropolitan',
    lat: -46.6334, long: -23.5507}),
  Ember.Object.create({
    id: 'place.9962989141465272', index: 0,
    place_name: "Some other place", text: 'Some place',
    lat: -46.6334, long: -23.5343547}),
  Ember.Object.create({
    id: 'place.9962989141465273', index: 0,
    place_name: "Never never land", text: 'Neverland',
    lat: -46.6334, long: -23.534307}),
  Ember.Object.create({
    id: 'place.9962989141465274', index: 0,
    place_name: "San Juan, Philippines", text: 'San Juan',
    lat: 121.146916, long: 14.599856}),
  ]);

function typeInInput(text) {
  this.$('.mapbox-autocomplete-input')
    .prop('value', text)
    .trigger('input');
}

moduleForComponent('mapbox-autocomplete', 'Integration | Component | mapbox-autocomplete', {
  integration: true
});

test('it works', function(assert) {
  // assert.expect(5);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', locations);
  this.set('options', locations);
  this.actions = {
    selectLocation(location) {
      this.set('selectedLocation', location);
    }
  };

  this.render(hbs`
    {{#mapbox-autocomplete
        on-select=(action "selectLocation")
        mapboxAccessToken='mapboxAccessToken'
        class="autocomplete-container" as |params|}}
      <div class="input-group">
        {{mapbox-autocomplete-input
            value=params.inputValue
            on-change=params.onInput
            type="text"
            class="combobox input-large form-control"
            placeholder="Enter an address..."}}
        {{#mapbox-autocomplete-list
            isVisible=params.isOpen
            class="typeahead typeahead-long dropdown-menu"}}
          {{#each params.options as |option|}}
            {{#mapbox-autocomplete-option
                index=option.index
                on-click=params.onSelect
                isFocused=(is-equal params.focusedIndex option.index)
                isSelected=(is-equal params.selectedIndex option.index)}}
              <a href="#">{{option.value}}</a>
            {{/mapbox-autocomplete-option}}
          {{else}}
            <li><a href="#">No results.</a></li>
          {{/each}}
        {{/mapbox-autocomplete-list}}
        {{#mapbox-autocomplete-dropdown-toggle on-click=params.toggleDropdown class="input-group-addon dropdown-toggle"}}
          <span class="caret"></span>
        {{/mapbox-autocomplete-dropdown-toggle}}
      </div>
    {{/mapbox-autocomplete}}
  `);

  function assertSelectedLocation(name) {
    assert.equal(this.get('selectedLocation.place_name'), name);
  }

  function assertOptionCount(count, message) {
    assert.equal(this.$('.mapbox-autocomplete-option').length, count, message);
  }

  typeInInput.call(this, 'San');


  this.$('ember-autocomplete-toggle').click();
  assertOptionCount.call(this, 5, "The filtered locations are shown");

  this.$('.mapbox-autocomplete-option:first').click();
  assertSelectedLocation.call(this, 'São Paulo, São Paulo, Brazil');

  this.$('ember-autocomplete-toggle').click();
  this.$('.mapbox-autocomplete-option:last').click();
  assertSelectedLocation.call(this, 'San Juan, Philippines');

  typeInInput.call(this, '');
});
