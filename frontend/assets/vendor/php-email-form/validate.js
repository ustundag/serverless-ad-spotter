/**
* PHP Email Form Validation - v2.0
* URL: https://bootstrapmade.com/php-email-form/
* Author: BootstrapMade.com
*/
!(function($) {
  "use strict";

  $('form.php-email-form').submit(function(e) {
    e.preventDefault();
    
    var f = $(this).find('.form-group'),
      ferror = false,
      emailExp = /^[^\s()<>@,;:\/]+@\w[\w\.-]+\.[a-z]{2,}$/i;

    f.children('input').each(function() { // run all inputs
     
      var i = $(this); // current input
      var rule = i.attr('data-rule');

      if (rule !== undefined) {
        var ierror = false; // error flag for current input
        var pos = rule.indexOf(':', 0);
        if (pos >= 0) {
          var exp = rule.substr(pos + 1, rule.length);
          rule = rule.substr(0, pos);
        } else {
          rule = rule.substr(pos + 1, rule.length);
        }

        switch (rule) {
          case 'required':
            if (i.val() === '') {
              ferror = ierror = true;
            }
            break;

          case 'minlen':
            if (i.val().length < parseInt(exp)) {
              ferror = ierror = true;
            }
            break;

          case 'email':
            if (!emailExp.test(i.val())) {
              ferror = ierror = true;
            }
            break;
          
          case 'url':
            if (!isValidURL(i.val())) {
              ferror = ierror = true;
            }
            break;
          
          case 'checked':
            if (! i.is(':checked')) {
              ferror = ierror = true;
            }
            break;

          case 'regexp':
            exp = new RegExp(exp);
            if (!exp.test(i.val())) {
              ferror = ierror = true;
            }
            break;
        }
        i.next('.validate').html((ierror ? (i.attr('data-msg') !== undefined ? i.attr('data-msg') : 'wrong Input') : '')).show('blind');
      }
    });
    f.children('textarea').each(function() { // run all inputs

      var i = $(this); // current input
      var rule = i.attr('data-rule');

      if (rule !== undefined) {
        var ierror = false; // error flag for current input
        var pos = rule.indexOf(':', 0);
        if (pos >= 0) {
          var exp = rule.substr(pos + 1, rule.length);
          rule = rule.substr(0, pos);
        } else {
          rule = rule.substr(pos + 1, rule.length);
        }

        switch (rule) {
          case 'required':
            if (i.val() === '') {
              ferror = ierror = true;
            }
            break;

          case 'minlen':
            if (i.val().length < parseInt(exp)) {
              ferror = ierror = true;
            }
            break;
        }
        i.next('.validate').html((ierror ? (i.attr('data-msg') != undefined ? i.attr('data-msg') : 'wrong Input') : '')).show('blind');
      }
    });
    if (ferror) return false;

    var this_form = $(this);
    var form_id = $(this).attr('id');

    switch (form_id) {
      case 'add-user':
        addUser();
        return true;

      case 'add-subscription':
        addSubscription();
        return true;

      case 'send-message':
        var action = $(this).attr('action');
        if( ! action ) {
          this_form.find('.loading').slideUp();
          // this_form.find('.error-message').slideDown().html('The form action property is not set!');
          alert("E-mail has been sent successfully!");
          return false;
        }
        this_form.find('.sent-message').slideUp();
        this_form.find('.error-message').slideUp();
        this_form.find('.loading').slideDown();
        if ( $(this).data('recaptcha-site-key') ) {
          var recaptcha_site_key = $(this).data('recaptcha-site-key');
          grecaptcha.ready(function() {
            grecaptcha.execute(recaptcha_site_key, {action: 'php_email_form_submit'}).then(function(token) {
              php_email_form_submit(this_form,action,this_form.serialize() + '&recaptcha-response=' + token);
            });
          });
        } else {
          php_email_form_submit(this_form,action,this_form.serialize());
        }
        return true;
    }

    return false    
  });

  function php_email_form_submit(this_form, action, data) {
    $.ajax({
      type: "POST",
      url: action,
      data: data,
      timeout: 40000
    }).done( function(msg){
      if (msg == 'OK') {
        this_form.find('.loading').slideUp();
        this_form.find('.sent-message').slideDown();
        this_form.find("input:not(input[type=submit]), textarea").val('');
      } else {
        this_form.find('.loading').slideUp();
        if(!msg) {
          msg = 'Form submission failed and no error message returned from: ' + action + '<br>';
        }
        this_form.find('.error-message').slideDown().html(msg);
      }
    }).fail( function(data){
      console.log(data);
      var error_msg = "Form submission failed!<br>";
      if(data.statusText || data.status) {
        error_msg += 'Status:';
        if(data.statusText) {
          error_msg += ' ' + data.statusText;
        }
        if(data.status) {
          error_msg += ' ' + data.status;
        }
        error_msg += '<br>';
      }
      if(data.responseText) {
        error_msg += data.responseText;
      }
      this_form.find('.loading').slideUp();
      this_form.find('.error-message').slideDown().html(error_msg);
    });
  }

  function addUser() {
      $('.user-id-response').empty();
      const endpoint_user = "https://90vyjnxjgl.execute-api.eu-central-1.amazonaws.com/Prod/user"
      var request = { }
      request.Name = $('#user-name').val().toString();
      request.Email = $('#user-email').val().toString();
      request.Phone = $('#user-phone').val().toString();

      $.post(endpoint_user, JSON.stringify(request), function(response){ 
            $('.user-id-response').append(
            `<br><ul>
            <li><i class="ri-check-double-line"></i> 
              User created successfully. Your User Id is ${response.userId}
            </li>
            </ul>`)
      });
  };

  function addSubscription() {
      $('.subscription-response').empty();
      const endpoint_subscription = "https://90vyjnxjgl.execute-api.eu-central-1.amazonaws.com/Prod/subscription"
      var request = { }
      request.Title = $('#sub-title').val().toString();
      request.UserId = parseInt($('#sub-user-id').val().toString(), 10)
      request.Email = $('#sub-email').val().toString();
      request.Url = $('#sub-url').val().toString();
      request.NotificationType = parseInt($('#sub-ntf-type').val().toString(), 10)
      request.PollPeriod = parseInt($('#sub-ntf-period').val().toString(), 10)

      $.post(endpoint_subscription, JSON.stringify(request))
      .always(function(response){ 
          var message = ""
          if(response.status == undefined) { // success
            message = response.message
          }
          else { // failed
            message = JSON.parse(response.responseText).message;
          }
          $('.subscription-response').append(
          `<br><ul>
          <li><i class="ri-check-double-line"></i> 
            ${message}
          </li>
          </ul>`)
      });
  };

  function isValidURL(url) {
    var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlregex.test(url);
  }

})(jQuery);
