import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import _ from 'lodash'
import Slider from 'rc-slider'
import { PrismCode } from 'react-prism'

const data = [
  [
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ],
  [
    [0, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ],
  [
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
  ],
  [
    [0, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 0, 1],
  ]
]


class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: 1,
      step: 0,
      max: 0,
      data: '',
      current: '',
    }
    this.init = this.init.bind(this);
    this.play = this.play.bind(this);
    this.update = this.update.bind(this);
    this.init()
  }

  init () {
    this.state.data = data
    this.state.max = data.length-1
    this.state.current = data[0]
  }

  play () {
    let timer = setInterval(() => {
      if (this.state.max <= this.state.step) {
        clearInterval(timer)
      } else {
        this.state.step++
        console.log(this.state)
        this.update()
      }
    }, 100)
  }

  update (step) {
    if (step) this.state.step = step
    this.state.current = this.state.data[this.state.step]
    this.setState(this.state)
  }

  render () {
    return <div>
      <div id="main" className="ui grid">
        <section className="eight wide column">
          <div id="container">
            {this.state.current.map( (col, i) => {
              return col.map( (row, j) => {
                if (this.state.current[i][j] === 0) {
                  return <div className="cell off" id={`cell-${i}-${j}`} ></div>
                } else {
                  return <div className="cell on" id={`cell-${i}-${j}`} ></div>
                }
              })
            })}
          </div>
          <br />
          <Slider
            dots
            min={0}
            max={this.state.max}
            value={this.state.step}
            // marks={marks}
            onChange={(value, ui) => {
              value = Math.floor(value)
              this.update(value)
            }}
          ></Slider>
          <br />
          <button className="ui button" onClick={this.play}><i className="fa fa-play"></i></button>
          <span>{this.state.step}</span>
        </section>
        <section id="data" className="eight wide column">

        </section>
      </div>
    </div>
  }
}

render(<App />, document.getElementById('root'))

const codeStore = (state, action) => {
  switch (action.typ) {
  case 'ADD':
    return {
      content: action.content
    }
  default:
    return state
  }
}

let store = createStore(codeStore)

const addCode = (content) => {
  return {
    type: 'ADD',
    content: content
  }
}

