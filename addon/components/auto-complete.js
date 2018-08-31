import Ember from 'ember';
import layout from '../templates/components/auto-complete';

export default Ember.Component.extend({
  "on-select": null,

  mapboxAccessToken: '',
  layout: layout,
  // minSearchLength:  2,
  resultsLimit:     5,
  isDropdownOpen:   false,
  input:            null,
  inputValue:       '',
  focusedIndex:     null,
  selectedIndex:    null,
  displayProperty:  'place_name',
  isBackspacing: false,

  items:            [],
  selectedItem: Ember.computed('selectedIndex', 'items.[]', function() {
    return this.get('items').objectAt(this.get('selectedIndex'));
  }),

  options: Ember.computed('items.[]', function() {
    return this.parseOptions(this.get('items'));
  }),

  toggleDropdown() {
    this.toggleProperty('isDropdownOpen');
  },

  openDropdown() {
    this.set('isDropdownOpen', true);
  },

  closeDropdown: function() {
    this.set('isDropdownOpen', false);
  },

  keydownMap: {
    8:  'startBackspacing', // backspace
    13: 'selectItem',  // return
    27: 'closeDropdown', // escape
    38: 'focusPrevious', // up key
    40: 'focusNext', // down key
  },

  startBackspacing: function() {
    this.set('isBackspacing', true);
  },

  setFocusedIndex(index) {
    this.set('focusedIndex', index);
  },

  setSelectedIndex(index) {
    this.set('selectedIndex', index);
  },

  resetFocusedIndex() {
    this.setFocusedIndex(null);
  },

  resetSelectedIndex() {
    this.setSelectedIndex(null);
  },

  focusPrevious: function(event) {
    event.preventDefault();
    const currentIndex = this.get('focusedIndex');
    let newIndex;
    if (Ember.isNone(currentIndex)) {
      newIndex = this.get('resultsLimit') - 1;
    } else if (currentIndex === 0) {
      newIndex = this.get('resultsLimit') - 1;
    } else {
      newIndex = currentIndex - 1;
    }
    this.setFocusedIndex(newIndex);
    this.openDropdown();
  },

  focusNext: function(event) {
    event.preventDefault();
    const currentIndex = this.get('focusedIndex');
    const lastIndex = this.get('resultsLimit') - 1;
    let newIndex;
    if (Ember.isNone(currentIndex)) {
      newIndex = 0;
    } else if (currentIndex === lastIndex) {
      newIndex = 0;
    } else {
      newIndex = currentIndex + 1;
    }
    this.setFocusedIndex(newIndex);
    this.openDropdown();
  },

  selectItem: function(event) {
    event.preventDefault();
    const focusedIndex = this.get('focusedIndex');
    if (Ember.isPresent(focusedIndex)) {
      this.send('selectItem', focusedIndex);
    }
    this.closeDropdown();
  },

  handleKeydown: Ember.on('keyDown', function(event) {
    const map = this.get('keydownMap');
    const code = event.keyCode;
    const method = map[code];
    if (method) {
      return this[method](event);
    }
  }),

  _inputValueForItem(item) {
    let displayProperty = this.get('displayProperty');
    return item.get(displayProperty);
  },

  _buildMapBoxUrl(query) {
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.get('mapboxAccessToken')}&limit=${this.get('resultsLimit')}`
  },

  searchPlaces(query) {
    console.log(query);
    _this = this;
    // if(query.length > this.get('minSearchLength')){
      Ember.$.ajax({
        url: this._buildMapBoxUrl(query),
        type: 'GET',
        dataType: 'json'
      }).then(function(data) {
        _this._parsePlaces(data.features);
      }, function(error) {
          console.log('failed to search places via mapbox', error);
      });
    // }
  },

  _parsePlaces(features) {
    let items = features.map((item, index) => {
      return Ember.Object.create({
        id: item.id,
        index: index,
        place_name: item.place_name,
        text: item.text,
        long: item.center[0],
        lat: item.center[1],
      });
    });
    this.set('items', items);
    this.set('options', this.parseOptions(items));
  },

  parseOptions(items) {
    let options = items.map((item, index) => {
      return Ember.Object.create({
        id: item.get('id'),
        index: index,
        value: item.get(this.get('displayProperty'))
      });
    });
    return Ember.A(options);
  },

  actions: {
    selectItem(index) {
      this.setSelectedIndex(index);
      let selectedItem = this.get('items')[index];
      this.get('on-select')(selectedItem);
      this.closeDropdown();
      this.set('inputValue', this._inputValueForItem(selectedItem));
    },

    inputDidChange(value) {
      this.searchPlaces(value);
      this.resetFocusedIndex();
      this.resetSelectedIndex();
      this.openDropdown();
      return new Ember.RSVP.Promise((resolve, reject) => {
        if (this.get('isBackspacing')) {
          this.set('inputValue', value);
          this.set('isBackspacing', false);
          reject();
        } else {
          Ember.run.scheduleOnce('afterRender', this, function() {
            const firstItem = this.get('items.firstObject');
            if (firstItem) {
              this.setSelectedIndex(0);
              // const inputValue = this._inputValueForItem(firstItem);
              // this.set('inputValue', inputValue);
              // Ember.run.next(this, () => {
              //   resolve({ start: value.length, end: inputValue.length });
              // });
            }
          });
        }
      });
    },

    toggleDropdown() {
      this.toggleDropdown();
    }
  }
});
