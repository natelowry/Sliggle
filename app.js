(function ($) {

    'use strict';

    var currentStream = null; // keep track of current stream

    function baseUrl() {
        return 'https://' + $('#baseUrl').val() + '.slack.com';
    }

    function photoUrl() {
        return baseUrl() + '/account/photo';
    }

    function uploadPicture() {
        $.get(photoUrl(), function (data) {
            var imageCrumb = data.match('type="hidden" name="crumb" value="(.*)"')[1];
            $("#crumb").val(imageCrumb);

            var formData = new FormData($('#theForm')[0]);
            var imgBase = $('#canvas')[0].toDataURL('image/png');

            var byteCharacters = atob(imgBase.substr(22));
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);

            var myBlob = new Blob([byteArray], {
                type: 'image/png'
            });
            formData.append('img', myBlob, 'ng.png');
            $.ajax({
                type: 'POST',
                url: photoUrl(),
                data: formData,
                processData: false,
                contentType: false,
                error: function (jqXHR, textStatus, errorMessage) {
                    $('#error').text(errorMessage);
                },
                success: function (data) {
                    //console.log(data);
                    var submitId = data.match('type="hidden" name="id" value="(.*)"')[1];
                    var submitCrumb = data.match('type="hidden" name="crumb" value="(.*)"')[1];

                    $.ajax({
                        type: 'POST',
                        url: photoUrl(),
                        data: {
                            'crop': '1',
                            'crumb': submitCrumb,
                            'id': submitId,
                            'cropbox': '40,0,240' //TODO: better cropping?
                        }
                    });
                }
            });

        });
    }

    function storeOptions() {
        chrome.storage.sync.set({ 'username': $('#username').val() });
        chrome.storage.sync.set({ 'baseUrl': $('#baseUrl').val() });
    }

    function login() {
        $.get(baseUrl(), function (data) {
            var loginCrumb = data.match('type="hidden" name="crumb" value="(.*)"')[1];

            $.post(baseUrl(), {
                signin: '1',
                crumb: loginCrumb,
                email: $('#username').val(),
                password: $('#password').val(),
                remember: 'on'
            }).fail(function (jqXHR, textStatus, errorThrown) {
                $('#error').text(errorMessage);
            });

        });
    }

    function enableCamera() {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

        navigator.getUserMedia({
            video: {
                mandatory: {
                    maxWidth: 320,
                    maxHeight: 240
                }
            },
            audio: false
        }, function (stream) {
            var videoElm = $('#video')[0];
            $('#video').show();
            $('#canvas').hide();

            videoElm.src = URL.createObjectURL(stream);

            videoElm.onplay = function () {
                if (currentStream !== null) {
                    // stop previous stream
                    currentStream.stop();
                }
                currentStream = stream;
            };
        }, function (e) {
            currentStream = null;
            console.error(e);
        });
    }

    function takePicture() {
        enableCamera();
        window.setTimeout(capture, 3000);
    }

    function capture() {
        var videoElement = $('#video')[0];

        var canvasElement = $('#canvas')[0];
        var context = canvasElement.getContext('2d');

        context.drawImage(videoElement, 0, 0, 320, 240);

        currentStream.stop();

        $('#video').hide();
        $('#canvas').show();
    }

    $('#takeBtn').click(takePicture);

    $('#login').click(function () {
        login();
    });

    $('.store-options').change(function () {
        storeOptions();
    });

    $('#upload').click(function () {
        uploadPicture();
    });

    var interval;
    $('#runForever').click(function () {
        $('#runForever').attr('disabled', 'disabled');
        $('#stop').attr('disabled', null);
        interval = window.setInterval(function () {
            takePicture();
            window.setTimeout(uploadPicture, 6000);
        }, 1000 * $('#refreshInterval').val());
    });

    $('#stop').click(function () {
        $('#stop').attr('disabled', 'disabled');
        $('#runForever').attr('disabled', null);
        window.clearInterval(interval);
    });

    $(document).ready(function () {
        chrome.storage.sync.get(['baseUrl', 'username'], function (data) {
            $('#baseUrl').val(data.baseUrl);
            $('#username').val(data.username);
        });
    });
}(jQuery));
