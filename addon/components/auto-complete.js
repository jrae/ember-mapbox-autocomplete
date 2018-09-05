import Ember from 'ember';
import layout from '../templates/components/auto-complete';

export default Ember.Component.extend({

  /**
   * Set default values in component init
   */
  init() {
    this._super(...arguments);
  },

  "on-select": null,

  mapboxAccessToken: '',
  layout: layout,
  minSearchLength:  2,
  resultsLimit:     5,
  isDropdownOpen:   false,
  input:            null,
  inputValue:       '',
  focusedIndex:     null,
  displayProperty:  'place_name',
  isBackspacing: false,
  searchTimeout: null,
  typingSearchDelay: 200,

  items: [],
  selectedItem: Ember.computed('focusedIndex', 'items.[]', function() {
    return this.get('items').objectAt(this.get('focusedIndex'));
  }),

  options: Ember.computed('items.[]', function() {
    return this.parseOptions(this.get('items'));
  }),

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
      debugger
      this.get('on-select')(null);;
    }
    this.closeDropdown();
  },

  _inputValueForItem(item) {
    return item.get(this.get('displayProperty'));
  },

  _buildMapBoxUrl(query) {
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.get('mapboxAccessToken')}&limit=${this.get('resultsLimit')}`
  },

  searchPlaces(query) {
    let _this = this;
    Ember.$.ajax({
      url: this._buildMapBoxUrl(query),
      type: 'GET',
      dataType: 'json'
    }).then(function(data) {
      _this._parsePlaces(data.features);
    }, function(error) {
        console.log('failed to search places via mapbox', error);
    });
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
        value: this._inputValueForItem(item)
      });
    });
    return Ember.A(options);
  },

  actions: {
    selectItem(index) {
      if(this.get('inputValue').length > this.get('minSearchLength')){
        console.log('index', index)
        this.setFocusedIndex(index);
        let selectedItem = this.get('items')[index];
        this.set('inputValue', this._inputValueForItem(selectedItem));
        this.get('on-select')(selectedItem);
        this.closeDropdown();
      } else {
        // selecting enter with no value
        this.get('on-select')(null);
      }
    },

    inputDidChange(value) {
      let _this = this
      this.set('inputValue', value);
      console.log('changed to', value)
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
