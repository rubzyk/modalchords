(function() {
  var _ref;

  if ((_ref = window.HAML) == null) {
    window.HAML = {};
  }

  window.HAML['login_template'] = function(context) {
    return (function() {
      var $c, $e, $o;
      $e = function(text, escape) {
        return ("" + text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
      };
      $c = function(text) {
        switch (text) {
          case null:
          case void 0:
            return '';
          case true:
          case false:
            return '' + text;
          default:
            return text;
        }
      };
      $o = [];
      $o.push("<div class='pop_up' id='login-modal'>\n  <div id='error'>\n    <p>something went wrong please retry</p>\n  </div>\n  <input id='email' name='email' size='" + ($e($c(30))) + "' type='text' placeholder='E-mail'>\n  <input id='password' name='password' size='" + ($e($c(30))) + "' type='password' placeholder='Password'>\n  <input id='submit' value='Login' type='submit'>\n  <div id='signup_link'>\n    <i class='icon-feather'></i>\n  </div>\n</div>");
      return $o.join("\n").replace(/\s(\w+)='true'/mg, ' $1').replace(/\s(\w+)='false'/mg, '');
    }).call(context);
  };

}).call(this);
