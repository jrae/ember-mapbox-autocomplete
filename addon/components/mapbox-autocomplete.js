import Ember from 'ember';
import layout from '../templates/components/mapbox-autocomplete';

export default Ember.Component.extend({

  /**
   * Set default values in component init
   */
  init() {
    this._super(...arguments);
  },

  "on-select": null,

  mapboxAccessToken: EmberENV.MAPBOX.ACCESS_TOKEN,
  layout: layout,
  minSearchLength:  2,
  resultsLimit:     5,
  isDropdownOpen:   false,
  input:            null,
  inputValue:       '',
  focusedIndex:     null,
  displayProperty:  'place_name',
  country_code:  null,
  types: null,
  isBackspacing: false,
  searchTimeout: null,
  typingSearchDelay: 200,

  items: [],
  options: [],

  keydownMap: {
    8:  'startBackspacing', // backspace
    13: 'selectItem',  // return
    27: 'closeDropdown', // escape
    38: 'focusPrevious', // up key
    40: 'focusNext', // down key
  },

  handleKeydown: Ember.on('keyDown', function(event) {
    const map = this.get('keydownMap');
    const code = event.keyCode;
    const method = map[code];
    if (method) {
      return this[method](event);
    }
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

  startBackspacing: function() {
    this.set('isBackspacing', true);
  },

  setFocusedIndex(index) {
    this.set('focusedIndex', index);
  },

  resetFocusedIndex() {
    this.setFocusedIndex(null);
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
    } else {
      this.get('on-select')(null);
    }
    this.closeDropdown();
  },

  inputValueForItem(item) {
    return item.get(this.get('displayProperty'));
  },

  buildMapBoxUrl(query) {
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.get('mapboxAccessToken')}&limit=${this.get('resultsLimit')}&country=${this.get('country_code')}&types=${this.get('types')}`;
  },

  searchPlaces(query) {
    let _this = this;
    Ember.$.ajax({
      url: this.buildMapBoxUrl(query),
      type: 'GET',
      dataType: 'json'
    }).then(function(data) {
      _this.parsePlaces(data.features);
    }, function(error) {
        console.log('failed to search places via mapbox', error);
    });
  },

  parsePlaces(features) {
    let items = features.map((item, index) => {
      return Ember.Object.create({
        id: item.id,
        index: index,
        place_name: item.place_name,
        text: item.text,
        long: item.center[0],
        lat: item.center[1],
        raw: item,
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
        value: this.inputValueForItem(item)
      });
    });
    return Ember.A(options);
  },

  actions: {
    selectItem(index) {
      this.setFocusedIndex(index);
      if(Ember.isPresent(this.get('inputValue'))) {
        let selectedItem = this.get('items')[index];
        this.set('inputValue', this.inputValueForItem(selectedItem));
        this.get('on-select')(selectedItem);
      } else {
        // Clear out value when text field is blank
        this.get('on-select')(null);
      }
      this.closeDropdown();
    },

    inputDidChange(value) {
      let _this = this;
      this.set('inputValue', value);
      if (this.get('isBackspacing')) {
        this.set('isBackspacing', false);
      } else if(value.length > this.get('minSearchLength')){
        clearTimeout(this.get('searchTimeout'));
        this.set('searchTimeout', setTimeout(function() {
          _this.setFocusedIndex(0);
          _this.searchPlaces(value);
          _this.openDropdown();
          }, _this.get('typingSearchDelay'))
        );
      }
    },

    toggleDropdown() {
      this.toggleDropdown();
    }
  }
});
