$(document).ready(function () {
    var $ = jQuery.noConflict();



    /* Клонируем блоки */

    $('.first-form-here').html($('.clone-it').html());
    $('.box-clone').html($('.box-clone-it').html());


    /* GR дата */
    var el = document.querySelector('input[name="custom_registration_date"]');
    var date = new Date;
    el.value = date.toISOString().substring(0, 10);
    document.querySelector('input[name="custom_registration_time"]').value = date.getUTCHours(); //new



    /* -== История с проверкой телефона ==- */


    // проверяем баланс
    BLS = 0; // принудительно принулим пока что 
    /*setTimeout(function(){
		
		$.ajax({
        type: "POST",
        url: "//marinarusakova.biz/static/smscheck/check_balance_sms.php",
        dataType: "json",
        success: function (req) {
            var obj = eval(req);
            console.log("баланс лицевого счёта: " + obj.bal + " руб.");
            BLS = obj.bal;
			}
		});
		
	},500);*/

    // проверка элемента на вхождение в массив
    function inArray(arr, el) {
        var arrL = arr.length - 1;
        var find = 0;
        for (var i = 0; i <= arrL; i++) {
            console.log("arr(i)= " + arr[i] + " el= " + el);
            if (arr[i] == el) {
                find = 1;
            }

        }
        if (find == 1)
            return true;
        else
            return false;
    }
    // запрет нажатия на Enter
    (function ($) {
        $.fn.noEnter = function () {
            this.keydown(function (eo) {
                //var arNokeys = [104,56,13];
                var arNokeys = [13]; // запрет нажатия Enter
                if (inArray(arNokeys, eo.keyCode)) {
                    eo.preventDefault();
                    console.log('Эту кнопку лучше не трогать!');
                }
            });
        };
    })(jQuery);

    // выводит ошибку
    function ShowError(elem, errorText) {
        if (elem && errorText) {
            elem.after('<br><span class="error-input">' + errorText + '</span>');
            elem.keyup(function () {
                var parentForm = $(this).parents('form');
                var errs = parentForm.find('.error-input');
                if (errs.size() > 0)
                    errs.remove();
            });
        }
    }

    // устанавливаем прогресс-бар
    function SetProgressBar(step, stepsAll, kudaBlock) {

        var pbItemWidth = 100 / stepsAll; // ширина "тычки" в прогрессбаре
        kudaBlock.find('.progress-bar-main').remove();
        var pb = '<div class="progress-bar-main">';
        pb += '<p class="pb-title">Шаг ' + step + ' из ' + stepsAll + '</p>';
        pb += '<div class="pb-line">';

        for (var i = 1; i <= stepsAll; i++) {
            var itemClass = i <= step ? 'pb-item alone' : 'pb-item';
            pb += '<span class="' + itemClass + '" style="width: ' + pbItemWidth + '%;"></span>';
        }

        pb += '</div>';
        pb += '</div>';

        kudaBlock.prepend(pb);
    }

    // Маска телефона
    (function ($) {
        $.fn.telMask = function () {
            var maskList = $.masksSort($.masksLoad("js/phone-codes.json"), ['#'], /[0-9]|#/, "mask");
            var maskOpts = {
                inputmask: {
                    definitions: {
                        '#': {
                            validator: "[0-9]",
                            cardinality: 1
                        }
                    },
                    showMaskOnHover: false,
                    autoUnmask: true
                },
                match: /[0-9]/,
                replace: '#',
                list: maskList,
                listKey: "mask",
                onMaskChange: function (maskObj, completed) {
                    if (completed) {
                        var hint = maskObj.name_ru;
                        if (maskObj.desc_ru && maskObj.desc_ru != "") {
                            hint += " (" + maskObj.desc_ru + ")";
                        }
                        $("#descr").html(hint);
                    } else {
                        $("#descr").html("Маска ввода");
                    }
                    $(this).attr("placeholder", "+_(___)___-____");
                }
            };
            this.inputmasks(maskOpts);
        };
    })(jQuery);

    function ShowStep(stepNum) {

        if (stepNum) {
            $('.check-phone-form>div').removeClass('active');
            $('.check-phone-form .step-' + stepNum).addClass('active');
        } else {
            console.log("не передан номер шага");
        }

    }

    // Отправка смски
    function SendSms(phoneNum, activeForm) {

        if (phoneNum && activeForm) {
            $.ajax({
                beforeSend: function () {
                    console.log("отправляем смс");
                },
                type: "POST",
                url: "//marinarusakova.biz/static/smscheck/send_sms.php",
                dataType: "json",
                data: "phone=" + phoneNum,
                success: function (req) {
                    var obj = eval(req);
                    if (!obj.error) {
                        ShowStep(2); // показываем след. шаг - поле ввода смс
                    } else {
                        var activePhoneInput = activeForm.find('input[type=tel]');
                        ShowError(activePhoneInput, "Ошибка отправки на номер " + phoneNum + ". Проверьте корректность ввода.");
                        console.log("Ошибка отправки смс ", obj.error);
                    }
                }
            });
        }
    }



    // проверка кода (из смс)
    function CheckCodeSms(checkCode, formAction) {
        if (checkCode && formAction) {
            $.ajax({
                type: "POST",
                url: "//marinarusakova.biz/static/smscheck/check_sms_code.php",
                dataType: "json",
                data: "code=" + checkCode,
                success: function (req) {
                    var obj = eval(req);
                    if (!obj.error) {
                        var hiddenCheckInput = formAction.find('input[name=checkit]');
                        hiddenCheckInput.val(1);
                        formAction.trigger("submit");
                    } else {
                        var smsCodeInput = formAction.find('input[name=codefromsms]');
                        ShowError(smsCodeInput, "Введите правильно код из смс");
                    }

                }
            });
        }
    }


    // отправляем в GR

    function SendToGR(form) {
        if (form) {

            var formData = form.serialize();

            var email = form.find('input[name=email]').val();
            var phone = form.find('input[name=custom_phone2]').val();
            var checkit = form.find('input[name=checkit]').val();
            var thankyou_url = form.find('input[name=thankyou_url]').val();
            var finishUrl = form.find('input[name=finish_url]').val();
            
            console.log("email", email);
            console.log("phone", phone);
            console.log("checkit", checkit);

            // отправляем или один email или только после подтверждения телефона
            if ((email != '' && phone == '') || (email != '' && phone != '' && checkit == 1)) {

                $.ajax({
                    type: "POST",
                    async: true,
                    url: "php/send_to_gr.php",
                    dataType: "json",
                    data: formData,
                    beforeSend: function () {
                        console.log("Аякс в ГР", formData);
                    },
                    success: function (req) {
                        var obj = eval(req);
                        console.log("obj.ok", obj.ok);
                        if (!obj.error) {

                            // редирект
             
                            if (email != '' && phone != '' && checkit == 1) {
                                console.log("Сейчас будет редирект на Thankyou page");
                                setTimeout(function () {
                                    window.location.href = thankyou_url;
                                }, 1000);
                            }

                        } else {
                            if(obj.error=='inbase'){
                                console.log("Уже в базе! делайте что-то! Быстро!");
                                setTimeout(function(){
                                    window.location = finishUrl;
                                },600);
                            } else if(obj.error=='subs'){ 
                                console.log("Ой, лапа, он ведь подписан, но не смотрел ещё.");
                                setTimeout(function(){
                                    window.location = thankyou_url;
                                },600);      
                            }
                        }
                    }
                });

            } // end if





        }
    }


    // "Зелёный свет" форме. Устанавливает флаг проверки формы в 1 и подменяет кнопку отправки СМС
    (function ($) {
        $.fn.makeGood = function () {
            console.log("Похоже, что закончились денежки на балансе СМС-сервиса");
            var checkItInput = this.find('input[name=checkit]');
            var sendSmsButton = this.find('button.send-sms');
            checkItInput.val(1);
            sendSmsButton.text('Отправить').attr('type', 'submit');

        };
    })(jQuery);


    // обработчик события кнопки отправки кода из СМС
    (function ($) {
        $.fn.CheckCodeAction = function () {
            this.click(function () {
                var parentForm = $(this).parents('form');
                var checkCode = parentForm.find('input[name=codefromsms]').val();
                console.log("checkCode", checkCode);
                CheckCodeSms(checkCode, parentForm);
            });
        };
    })(jQuery);


    // Проверка телефона при сабмите форм

    (function ($) {
        $.fn.checkItPhone = function () {
            console.log('Checking phone!!!!');

            // устанавливаем прогрессбар
            var kudkuda = this.parent('div'); // родительский блок формы
            SetProgressBar(1, 2, kudkuda);

            this.append('<input type="hidden" value="0" name="checkit">');

            this.submit(function () {
                var checkParam = $(this).find('input[name=checkit]').val();
                var clientPhone = $(this).find('input[type=tel]').val();
                var checkSmsCode = $(this).find('input[name=codefromsms]').val();

                if (checkParam == 0) {

                    // выводим форму с вводом телефона
                    var phoneForm = '<div class="check-phone-form"><div class="step-1 active"><p class="cpf-title">Укажите Ваш телефон,<br> подтвердите, что вы не робот:</p><p><input type="tel" name="custom_phone2" min="10"></p><p><button type="button" class="easy-button send-sms">Отправить СМС с кодом</button></p><p class="ann">Нажимая на кнопку, Вы даете <br><a href="http://marinarusakova.biz/politika-obrabotki-personalnyh-dannyh/" title="согласие на обработку своих персональных данных" target="_blank">согласие на обработку своих персональных данных</a></p></div><div class="step-2"><p class="cpf-title">Введите, пожалуйста,<br> код подтверждения:</p><p><input type="text" name="codefromsms"></p><p><button type="button" class="easy-button check-sms">Отправить</button></p></div></div>';



                    if (typeof (clientPhone) == 'undefined') { // если телефон ещё не вводили, то активируем
                        $(this).append(phoneForm);
                        SetProgressBar(2, 2, kudkuda);
                        $('input[type=tel]').telMask();
                        $('input').noEnter();
                    } else { // иначе - следующий шаг
                        ShowStep(2);
                        SetProgressBar(2, 2, kudkuda);
                    }


                    if (BLS > 2) {
                        // вешаем обработчик на кнопку отправки СМС
                        var sendSmsutton = $(this).find('.easy-button.send-sms');
                        sendSmsutton.click(function () {
                            var parentForm = $(this).parents('form');
                            var phoneSms = parentForm.find('input[type=tel]').val();
                            var checCodeBtn = parentForm.find('.easy-button.check-sms');
                            console.log("Что будем с этим делать?", phoneSms);
                            SendSms(phoneSms, $(this));
                            checCodeBtn.CheckCodeAction();

                        });
                    } else {
                        $(this).makeGood();
                    }



                    if (checkSmsCode) { // код уже введён
                        CheckCodeSms(checkSmsCode, $(this));
                    }

                    // отправляем что есть
                    SendToGR($(this));

                    return false;
                } else {
                    SendToGR($(this));
                    return false; // не даём форме засабмититься по-людски, всё через API !
                    //return true;
                }
            });

        };
    })(jQuery);

   // $('.mainform').checkItPhone();
    $('input').noEnter();
    
    
    
    $('.to-top').click(function(){
        $("body,html").animate({scrollTop:0}, '2000');
    });
    
});
