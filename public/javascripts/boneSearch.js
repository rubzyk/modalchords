var SearchCollView, UserSearch, UserSearchColl, UserSearchView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

UserSearch = (function(_super) {

  __extends(UserSearch, _super);

  function UserSearch() {
    return UserSearch.__super__.constructor.apply(this, arguments);
  }

  UserSearch.prototype.idAttribute = '_id';

  UserSearch.prototype.paramRoot = 'api/searches';

  UserSearch.prototype.urlRoot = "/api/searches";

  UserSearch.prototype.state_classes = ["enabled", "uniq", "optional", "disabled"];

  UserSearch.prototype.initialize = function() {
    return this.degrees = {
      root: {
        names: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
      },
      second: {
        names: ["m2", "M2", "\#2"]
      },
      third: {
        names: ["o3", "m3", "M3", "\#3"]
      },
      fourth: {
        names: ["b4", "P4", "+4"]
      },
      fifth: {
        names: ["b5", "P5", "+5"]
      },
      sixt: {
        names: ["m6", "M6", "\#6"]
      },
      seventh: {
        names: ["o7", "m7", "M7"]
      }
    };
  };

  return UserSearch;

})(Backbone.Model);

UserSearchView = (function(_super) {

  __extends(UserSearchView, _super);

  function UserSearchView() {
    this.hideControls = __bind(this.hideControls, this);

    this.renderTuning = __bind(this.renderTuning, this);

    this.renderStruct = __bind(this.renderStruct, this);
    return UserSearchView.__super__.constructor.apply(this, arguments);
  }

  UserSearchView.prototype.className = "search";

  UserSearchView.prototype.initialize = function() {
    _.bindAll(this, 'render');
    this.model.bind('refresh', this.render);
    this.settings_view = new SettingsView({
      model: this.model
    });
    return this.settings_view.mother = this;
  };

  UserSearchView.prototype.struct_template = window.HAML['struct_template'];

  UserSearchView.prototype.tuning_template = window.HAML['tuning_template'];

  UserSearchView.prototype.events = {
    "click i.icon-cancel-2": "delete_search",
    "click i.icon-rocket": "load_search",
    "click i.icon-cog-1": "toggle_options",
    "click i.icon-tumbler": "toggle_tuning",
    "click i.icon-heart-1": "save_search",
    "click i.icon-refresh": "search",
    "click .main": "cycle_status",
    "click .bub": "alt_degree",
    "mouseenter .wrapper": "show_degree_control",
    "mouseleave .wrapper": "hide_degree_control",
    "click .little_circle": "assign_status",
    "focusout .user-search-name input": "update_name",
    "mouseleave #tuning-wrapper": "update_tuning",
    "click #tuning-wrapper #strings": "nb_strings_update"
  };

  UserSearchView.prototype.render = function() {
    this.$el.html("<div id='tuning-menu'></div><div id='struct-wrap'></div></div>");
    if (this.model.get('name') !== "user_current_search") {
      this.$el.prepend("<div class='user-search-name'><input type='text' value=\"" + (this.model.get('name')) + "\"></input></div>");
    }
    this.renderTuning();
    this.renderStruct();
    this.$el.append(this.settings_view.render().el);
    this.hideControls();
    return this;
  };

  /* SUB-RENDER
  */


  UserSearchView.prototype.renderStruct = function() {
    this.$el.find('#struct-wrap').html(this.struct_template(this.model.toJSON()));
    this.hide_stuffs();
    this.degrees_init();
    return this;
  };

  UserSearchView.prototype.renderTuning = function() {
    this.$el.find('#tuning-menu').html(this.tuning_template(this.model.toJSON()));
    this.init_tuning_boxes();
    return this;
  };

  UserSearchView.prototype.hideControls = function() {
    return this.$el.find('#tuning-menu').hide();
  };

  UserSearchView.prototype.delete_search = function() {
    this.$el.remove();
    return this.model.destroy();
  };

  UserSearchView.prototype.update_name = function(e) {
    return this.model.save({
      name: $(e.currentTarget).val()
    });
  };

  UserSearchView.prototype.update_model = function(callback) {
    var d, degs, dsh, get_val, stat;
    dsh = {};
    degs = this.model.degrees;
    stat = this.model.state_classes;
    get_val = function(id) {
      return dsh[id] = degs[id].names[degs[id].current] + " " + stat[degs[id].state];
    };
    for (d in degs) {
      get_val(d);
    }
    this.model.set("degree_status_hash", dsh);
    if (callback) {
      return this.model.save({}, {
        success: callback
      });
    } else {
      return this.model.save();
    }
  };

  UserSearchView.prototype.save_search = function() {
    this.search();
    return router.app.modals.pop_search_naming();
  };

  UserSearchView.prototype.load_search = function() {
    var callback,
      _this = this;
    callback = function() {
      var after_transfer, coll, current_search, search_to_load;
      coll = router.app.usc;
      current_search = coll.filter(function(s) {
        return s.attributes.name === "user_current_search";
      })[0];
      search_to_load = $.extend(true, {}, _this.model.toJSON());
      delete search_to_load._id;
      delete search_to_load.name;
      after_transfer = function() {
        return $.get("/load_current_search", function(r) {
          router.navigate('', {
            trigger: true
          });
          return router.app.searchResults.fetch({
            reset: true
          });
        });
      };
      current_search.save(search_to_load, {
        success: after_transfer
      });
      return current_search.trigger('refresh');
    };
    return this.update_model(callback);
  };

  UserSearchView.prototype.search = function() {
    var callback;
    callback = function() {
      return $.get("/load_current_search", function(r) {
        return router.app.searchResults.fetch({
          reset: true
        });
      });
    };
    return this.update_model(callback);
  };

  UserSearchView.prototype.degrees_init = function() {
    var di, i, _results,
      _this = this;
    di = function(id) {
      var current_el, infos, name, status;
      current_el = _this.$el.find("#struct_form_wrap #" + id);
      infos = _this.model.get('degree_status_hash')[id].split(" ");
      status = infos[1];
      name = infos[0];
      _this.model.degrees[id].state = _this.model.state_classes.indexOf(status);
      _this.model.degrees[id].current = _this.model.degrees[id].names.indexOf(name);
      current_el.find(".main b").html(name);
      current_el.find(".main").removeClass('uniq enabled disabled optional').addClass(status);
      return current_el.find(".bub").removeClass('uniq enabled disabled optional').addClass(status);
    };
    _results = [];
    for (i in this.model.degrees) {
      _results.push(di(i));
    }
    return _results;
  };

  UserSearchView.prototype.init_tuning_boxes = function() {
    var index, num, _i, _len, _ref, _results;
    this.strings_nb_ib = new IncBox({
      el: this.$el.find('#tuning-wrapper #strings'),
      current: this.model.get('strings_nb'),
      min: 4,
      max: 8
    });
    this.tuning_midi_boxes = new Array(8);
    _ref = ["one", "two", "three", "four", "five", "six", "seven", "eight"];
    _results = [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      num = _ref[index];
      _results.push(this.tuning_midi_boxes[index] = new MidiBox({
        el: this.$el.find("#tuning #" + num),
        pitch: this.model.attributes.tuning[index]
      }));
    }
    return _results;
  };

  UserSearchView.prototype.hide_stuffs = function() {
    this.$el.find('.bub').hide();
    return this.$el.find('.state-selector-wrap').hide();
  };

  UserSearchView.prototype.cycle_status = function(e) {
    var id, k;
    id = $(e.currentTarget).parent().attr("id");
    this.model.degrees[id].state = (this.model.degrees[id].state + 1) % this.model.state_classes.length;
    k = this.model.state_classes[this.model.degrees[id].state];
    $(e.currentTarget).removeClass('uniq enabled disabled optional').addClass(k);
    return $(e.currentTarget).parent().find(".bub").removeClass('uniq enabled disabled optional').addClass(k);
  };

  UserSearchView.prototype.show_degree_control = function(e) {
    $(e.currentTarget).find('.bub').show();
    return $(e.currentTarget).find('.state-selector-wrap').show();
  };

  UserSearchView.prototype.hide_degree_control = function(e) {
    $(e.currentTarget).find('.bub').hide();
    return $(e.currentTarget).find('.state-selector-wrap').hide();
  };

  UserSearchView.prototype.current_change = function(p, mod) {
    var content, deg, id;
    id = p.parent().attr("id");
    deg = this.model.degrees[id];
    deg.current = (deg.current + mod + deg.names.length) % deg.names.length;
    content = deg.names[deg.current];
    return p.parent().find('.main b').html(content);
  };

  UserSearchView.prototype.alt_degree = function(e) {
    if ($(e.currentTarget).hasClass('top')) {
      return this.current_change($(e.currentTarget), 1);
    } else {
      return this.current_change($(e.currentTarget), -1);
    }
  };

  UserSearchView.prototype.assign_status = function(e) {
    var id, k;
    id = $(e.currentTarget).parent().parent().attr("id");
    if ($(e.currentTarget).hasClass('enabled')) {
      this.model.degrees[id].state = 0;
      k = this.model.state_classes[0];
    }
    if ($(e.currentTarget).hasClass('uniq')) {
      this.model.degrees[id].state = 1;
      k = this.model.state_classes[1];
    }
    if ($(e.currentTarget).hasClass('optional')) {
      this.model.degrees[id].state = 2;
      k = this.model.state_classes[2];
    }
    if ($(e.currentTarget).hasClass('disabled')) {
      this.model.degrees[id].state = 3;
      k = this.model.state_classes[3];
    }
    $(e.currentTarget).parent().parent().find('.main').removeClass('uniq enabled disabled optional').addClass(k);
    return $(e.currentTarget).parent().parent().find(".bub").removeClass('uniq enabled disabled optional').addClass(k);
  };

  UserSearchView.prototype.toggle_options = function(e) {
    var ssv,
      _this = this;
    ssv = this.$el.find('.search-settings-view');
    if (ssv.is(":visible")) {
      return ssv.slideUp();
    } else {
      ssv.find('.toggle').hide();
      return ssv.slideDown(200, function() {
        return ssv.find('.toggle').fadeIn();
      });
    }
  };

  UserSearchView.prototype.update_tuning = function() {
    var e, i, s, tuning, _fn, _i, _len, _ref,
      _this = this;
    s = this.strings_nb_ib.get_val();
    tuning = [];
    _ref = this.tuning_midi_boxes;
    _fn = function(e, i) {
      if (i < s) {
        return tuning.push(e.get_val());
      }
    };
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      e = _ref[i];
      _fn(e, i);
    }
    console.log(tuning);
    this.model.set({
      tuning: tuning
    });
    return this.model.save();
  };

  UserSearchView.prototype.nb_strings_update = function() {
    var cb,
      _this = this;
    cb = function() {
      _this.model.set({
        strings_nb: _this.strings_nb_ib.get_val()
      });
      _this.model.save();
      return _this.renderTuning();
    };
    this.update_tuning();
    return setTimeout(cb, 250);
  };

  UserSearchView.prototype.toggle_tuning = function() {
    var tm;
    tm = this.$el.find('#tuning-menu');
    if (tm.is(":visible")) {
      return tm.slideUp();
    } else {
      return tm.slideDown();
    }
  };

  return UserSearchView;

})(Backbone.View);

UserSearchColl = (function(_super) {

  __extends(UserSearchColl, _super);

  function UserSearchColl() {
    return UserSearchColl.__super__.constructor.apply(this, arguments);
  }

  UserSearchColl.prototype.model = UserSearch;

  UserSearchColl.prototype.url = "/api/searches";

  return UserSearchColl;

})(Backbone.Collection);

SearchCollView = (function(_super) {

  __extends(SearchCollView, _super);

  function SearchCollView() {
    return SearchCollView.__super__.constructor.apply(this, arguments);
  }

  SearchCollView.prototype.collection = UserSearchColl;

  SearchCollView.prototype.initialize = function() {
    this.collection.on('add', this.addOne, this);
    return this.collection.on('reset', this.addAll, this);
  };

  SearchCollView.prototype.render = function() {
    return this.addAll();
  };

  SearchCollView.prototype.addAll = function() {
    this.$el.empty();
    $('#user-area').hide();
    return this.collection.forEach(this.addOne, this);
  };

  SearchCollView.prototype.addOne = function(item) {
    var itemView;
    itemView = new UserSearchView({
      model: item
    });
    if (item.get('name') === "user_current_search") {
      return $('#main-search').html(itemView.render().el);
    } else {
      return $('#user-searches').append(itemView.render().el);
    }
  };

  return SearchCollView;

})(Backbone.View);
