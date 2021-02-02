import React, { useEffect, useRef, useState } from 'react'
import Styled, { keyframes, css } from 'styled-components'
// import PropTypes from 'prop-types'

import captureFromWebcam from '../functions/capture-from-webcam'

import DeviceContext from '../context/device-context'

import MirrorPreview from './mirror-preview'
import PlayIcon from './icon-play'
import timer from './timer-hooks'

import useWindowSize from './window-resize-hook'



const minVideoSize = 200
const previewGridGap = 16

const videoSize = {
  width: 350, // Math.max((windowWidth / 3) - (previewGridGap * 2), minVideoSize),
  height: 350, // Math.max((windowWidth / 3) - (previewGridGap * 2), minVideoSize),
}

const previewCommonStyles = css`
  width: ${p => videoSize.width}px;
  height: ${p => videoSize.height}px;
`


// ? Components

const Wrapper = Styled.div`
  margin-bottom: 20rem;
`

const PreviewWrapper = Styled.div`
  display: ${p => p.windowWidth >= videoSize.width * 3 ? 'grid' : 'block'};
  /* grid-template-columns: repeat(3, ${videoSize.width}px); */
  grid-template-columns: repeat(auto-fill, minmax(${videoSize.width}px, 1fr));
  justify-items: center;
  align-items: center;
  /* gap: ${previewGridGap}px; */
  width: ${p => p.windowWidth >= videoSize.width * 3 ? '100vw' : `${videoSize.width}px`};
  max-width: ${(videoSize.width * 3) + (previewGridGap * 2)}px;
  /* height: calc(1200px / 3); */
  margin: 0 auto;
  outline: solid 1px lime;
`
const Canvas = Styled.canvas`
  ${previewCommonStyles};
`
// This canvas is used to convert the video
// it is not intended to be seen
const CanvasStaging = Styled.canvas`
  display: none;
  width: 0;
  height: 0;
  pointer-events: none;
`
const Video = Styled.video`
  ${previewCommonStyles};
  background: black;
`
const ControlsWrapper = Styled.section`
  display: grid;
  justify-content: center;
  padding: 6rem 0;
`
const Button = Styled.button`
  background: none;
  color: none;
  border: none;
  outline: none;
  box-shadow: none;
  cursor: pointer;
  &:hover {
    svg path {
      fill: tomato;
    }
  }
`

const CountdownWrapper = Styled.div`
  display: grid;
  justify-content: center;
`
const Countdown = Styled.span`
  font-size: 10rem;
  text-align: center;
  font-family: dharma-gothic-e, sans-serif;
`

const VideoWrapper = Styled.div`
  position: relative;
`
const Live = Styled.div`
  position: absolute;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  left: 50%;
  transform: translate(-50%, -150%);
  padding: 4px 12px;
  border: solid 1px white;
  border-radius: 100px;
  background: black;
  @media screen and (prefers-color-scheme: dark) {
    background: white;
  }
`

const pulse = keyframes`
  0% {
    opacity: 1
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1
  }
`
const LiveMarker = Styled.div`
  border-radius: 100px;
  background: indianred;
  width: 16px;
  height: 16px;
  margin-right: 1rem;
  display: inline-block;
  animation: 1.5s ${pulse} infinite ease-in-out;
  transform: scale(1.2);
`
const LiveText = Styled.p`
  font-size: 3rem;
  font-weight: bold;
  margin: 0;
  padding: 0;
  color: white;
  @media screen and (prefers-color-scheme: dark) {
    color: black;
  }
`
const CenterLine = Styled.span`
  position: absolute;
  left: 50%;
  top: 0;
  height: 100%;
  width: 0;
  border-left: dotted 4px red;
`


// ! Webcam app
const WebCam = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const previewRefLeft = useRef(null)
  const previewRefRight = useRef(null)

  const [ cameraLive, setCameraLive ] = useState(false)
  const [ duration, setDuration ] = useState(5000)
  const [ showTimer, setShowTimer ] = useState(false)
  const [ hasRun, setHasRun ] = useState(false)

  const [ windowWidth, windowHeight ] = useWindowSize()

  const {
    time,
    setTime,
    isRunning,
    setIsRunning,
  } = timer()

  useEffect (() => {
    // if (cameraLive) {
      
      // setIsRunning(false)
    // }

    if ((time * 1000) >= duration) {
      setIsRunning(false)
      setCameraLive(false)
    }

  }, [time, isRunning, cameraLive])


  const handleButtonClick = () => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      setTime(0)
      setIsRunning(true)
      setHasRun(true)
      setCameraLive(true)
      captureFromWebcam({ videoSize, videoRef, canvasRef, previewRefLeft, previewRefRight, duration, setCameraLive })
    }
  }



  return <Wrapper>
    <CanvasStaging ref={ canvasRef } />

    <DeviceContext.Consumer>
      { ({ device }) => device === 'mobile' &&
        <ControlsWrapper>{
          isRunning
          ? <CountdownWrapper>
              <p>Image ready in ...</p>
              <Countdown>{ (duration / 1000) - time }</Countdown>
            </CountdownWrapper>
          : <Button onClick={ handleButtonClick }>
              <PlayIcon size={ 100 } fill="#ffffff" />
            </Button>
        }</ControlsWrapper>
      }
    </DeviceContext.Consumer>

    <PreviewWrapper windowWidth={ windowWidth }>
      {
        windowWidth < videoSize.width * 3 &&
          <MirrorPreview
            showOverlay={ !isRunning && hasRun }
            canvas={ canvasRef }
            name="recored-image"
          >
            <Video ref={ videoRef } />
            { isRunning && <CenterLine /> }
            {
              isRunning &&
                <Live>
                  <LiveMarker />
                  <LiveText>Recording</LiveText>
                </Live>
            }
            <h3>live-preview</h3>
          </MirrorPreview>
      }


      <MirrorPreview
        showOverlay={ !isRunning && hasRun }
        canvas={ previewRefLeft }
        name="mirror-left"
      >
        <Canvas ref={ previewRefLeft } />
        <h3>mirror-left</h3>
      </MirrorPreview>

      {
        windowWidth >= videoSize.width * 3 &&
          <MirrorPreview
            showOverlay={ !isRunning && hasRun }
            canvas={ canvasRef }
            name="recored-image"
          >
            <Video ref={ videoRef } />
            { isRunning && <CenterLine /> }
            {
              isRunning &&
                <Live>
                  <LiveMarker />
                  <LiveText>Recording</LiveText>
                </Live>
            }
            <h3>live-preview</h3>
          </MirrorPreview>
      }


      {/* <VideoWrapper>
        <Video ref={ videoRef } />
        { isRunning && <CenterLine /> }
        {
          isRunning &&
            <Live>
              <LiveMarker />
              <LiveText>Recording</LiveText>
            </Live>
        }
      </VideoWrapper> */}

      <MirrorPreview
        showOverlay={ !isRunning && hasRun }
        canvas={ previewRefRight }
        name="mirror-right"
      >
        <Canvas ref={ previewRefRight } />
        <h3>mirror-right</h3>
      </MirrorPreview>
    </PreviewWrapper>


    {/* <CountdownWrapper></CountdownWrapper> */}


    <DeviceContext.Consumer>
      { ({ device }) => device === 'desktop' &&
        <ControlsWrapper>{
          isRunning
          ? <CountdownWrapper>
              <p>Image ready in ...</p>
              <Countdown>{ (duration / 1000) - time }</Countdown>
            </CountdownWrapper>
          : <Button onClick={ handleButtonClick }>
              <PlayIcon size={ 100 } fill="#ffffff" />
            </Button>
        }</ControlsWrapper>
      }
    </DeviceContext.Consumer>

    {/* <pre>
      pixels length: { pixelState?.length } | 
      grouped: { groupPixels(pixelState)?.length }
    </pre> */}
  </Wrapper>
}


export default WebCam
