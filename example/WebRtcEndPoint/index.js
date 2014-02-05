var RTCPeerConnection = mozRTCPeerConnection || RTCPeerConnection || webkitRTCPeerConnection;


var WebRtcEndPoint = KwsMedia.endpoints.WebRtcEndPoint;


navigator.webkitGetUserMedia({'audio': true, 'video': true}, function(stream)
{
  var videoInput  = document.getElementById("videoInput");
  var videoOutput = document.getElementById("videoOutput");

  videoInput.src = URL.createObjectURL(stream);


  KwsMedia('ws://192.168.0.110:7788/thrift/ws/websocket',
  function(kwsMedia)
  {
    // Create pipeline
    kwsMedia.createMediaPipeline(function(error, pipeline)
    {
      if(error) return console.error(error);

      // Create pipeline media elements (endpoints & filters)
      WebRtcEndPoint.create(pipeline, function(error, webRtc)
      {
        if(error) return console.error(error);

        pipeline.connect(webRtc, webRtc);  // loopback

        // Create a PeerConnection client in the browser
        var peerConnection = new RTCPeerConnection
        (
          {iceServers: [{url: 'stun:stun.l.google.com:19302'}]},
          {optional:   [{DtlsSrtpKeyAgreement: true}]}
        );

        peerConnection.addStream(stream);

        // Connect the pipeline to the PeerConnection client
        webRtc.generateSdpOffer(function(error, offer)
        {
          if(error) return console.error(error);

          peerConnection.setRemoteDescription(
          new RTCSessionDescription({sdp: offer, type: 'offer'}),
          function()
          {
            peerConnection.createAnswer(function(answer)
            {
              peerConnection.setLocalDescription(answer, function()
              {

                webRtc.processSdpAnswer(answer, function(error)
                {
                  if(error) return console.error(error);

                  var stream = peerConnection.getRemoteStreams()[0];

                  // Set the stream on the video tag
                  videoOutput.src = URL.createObjectURL(stream);

//                  // Start player
//                  pipeline.start();
                });

              },
              console.error);
            },
            console.error);
          },
          console.error);

        });
      });
    });
  },
  function(error)
  {
    console.error('An error ocurred:',error);
  });
});