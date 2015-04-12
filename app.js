var curStream = null; // keep track of current stream

function baseUrl(){
	return "https://" + $("#baseUrl").val() + ".slack.com";
}

function photoUrl(){
	return baseUrl() + '/account/photo';
}

function pic() {
	$.get(photoUrl(), function (data) {
		var imageCrumb = data.match('type="hidden" name="crumb" value="(.*)"')[1];
		$("#crumb").val(imageCrumb);

		var formData = new FormData($("#theForm")[0]);
		var imgBase = canvas.toDataURL("image/png");

		var byteCharacters = atob(imgBase.substr(22));
		var byteNumbers = new Array(byteCharacters.length);
		for (var i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		var byteArray = new Uint8Array(byteNumbers);

		var myBlob = new Blob([byteArray], {
				type : 'image/png'
			})
			formData.append("img", myBlob, 'ng.png')
			$.ajax({
				type : "POST",
				url : photoUrl(),
				data : formData,
				processData : false,
				contentType : false,
				error : function (jqXHR, textStatus, errorMessage) {
					console.log(errorMessage); // Optional
				},
				success : function (data, status, jqxhr) {
					console.log(data); // type="hidden" name="id" value="
					var submitId = data.match('type="hidden" name="id" value="(.*)"')[1];
					var submitCrumb = data.match('type="hidden" name="crumb" value="(.*)"')[1];

					$.ajax({
						type : "POST",
						url : photoUrl(),
						data : {
							'crop' : '1',
							'crumb' : submitCrumb,
							'id' : submitId,
							'cropbox' : '0,0,240' //TODO: better cropping?
						}
					});
				}
			});

	});
}

function login() {
	$.get(baseUrl(), function (data) {
		var loginCrumb = data.match('type="hidden" name="crumb" value="(.*)"')[1];

		$.post(baseUrl(), {
			'signin' : '1',
			'crumb' : loginCrumb,
			'email' : $("#username").val(),
			'password' : $("#password").val(),
			'remember' : 'on'

		}, function (data) {
			console.log(data);
		});

	});
}

function enableCamera() {
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

	navigator.getUserMedia({
		video : true,
		audio : false
	}, function (stream) {
		var videoElm = $('#video')[0];
		videoElm.src = URL.createObjectURL(stream);

		videoElm.onplay = function () {
			if (curStream !== null) {
				// stop previous stream
				curStream.stop();
			}
			curStream = stream;
		}
	}, function (e) {
		curStream = null;
		console.error(e);
	});
}

function takePicture() {
	enableCamera();
	window.setTimeout(capture, 3000);
}

function capture(){
	
	var videoElement = $("#video")[0];

	var canvasElement = $("#canvas")[0];
	var context = canvasElement.getContext("2d");

	context.drawImage(videoElement, 0, 0, 320, 240);

	curStream.stop();
}

$("#takeBtn").click(takePicture	);

$("#login").click(function(){
	login();
});

$("#upload").click(function(){
	pic();
});

var interval;
$("#runForever").click(function(){
	interval = window.setInterval(function(){
		takePicture();
		window.setTimeout(pic, 6000);
	}, 1000*60);
});

$("#stop").click(function(){
	window.clearInterval(interval);
})