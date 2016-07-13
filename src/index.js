import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import _ from 'lodash'
import Slider from 'rc-slider'
import { PrismCode } from 'react-prism'

const marks = {
  '-10': '-10°C',
  0: <strong>0°C</strong>,
  26: '26°C',
  37: '37°C',
  50: '50°C',
  100: {
    style: {
      color: 'red',
    },
    label: <strong>100°C</strong>,
  },
};

function log(value) {
  console.log(value);
}


class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: 1,
      code: '',
      data_a: '',
      data_b: '',
      step_a: '',
      step_b: '',
      lines: '',
      error: false,
      step: 0,
      max: 0,
      height: 35,
      hints: [],
      reveal: 0
    }
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
    this.play = this.play.bind(this);
    this.update = this.update.bind(this);
    this.init = this.init.bind(this);
    this.change = this.change.bind(this);
    this.nextHint = this.nextHint.bind(this);
    this.init()
  }

  init () {
    let id = window.location.pathname.split('/')[1]
    if (id) this.state.id = id

    $.get(`sample/data-${this.state.id}.py`, function (res) {
      this.setState({
        code: res,
      })
      let len = res.split('\n').length
      for (let i=0; i<len; i++) {
        $('#output').append(`<div id="line-${i+1}"></div>`)
      }

    }.bind(this))
    $.get(`sample/data-${this.state.id}.json`, function (res) {
      console.log('res')
      this.state.step = 0
      this.state.lines = res.lines
      this.state.data_a = res.attempt
      this.state.data_b = res.fixed
      this.state.max = _.max([res.attempt.length, res.fixed.length])
      this.state.hints = res.hints
      this.setState(this.state)
    }.bind(this))

  }

  update (value) {
    if (value) this.state.step = value
    let line = this.state.lines[this.state.step-1]
    let height = 35 + 21 * (line - 1)
    let outputs = this.state.data_a[this.state.step-1]
    let error = false
    let html = outputs.map( (output) => {
      if (!output.fixed) {
        return `<span class='output-var'>${output.var}</span> = <span class='output-data'>${output.data}</span>`
      } else {
        error = {
          var: output.var,
          data: output.data,
          fixed: output.fixed
        }
        return `<span class='output-var'>${output.var}</span> = <span class='output-data output-error'>${output.data}</span>`
      }
    }).join(', ')

    if (error) {
      $('#error')
      .text(`x ${error.data} o ${error.fixed}`)
      .css({top: height-40 })
      .show()
    } else {
      $('#error').hide()
    }

    let len = this.state.code.split('\n').length
    for (let i=len; i>line; i--) {
      $(`#line-${i}`).text(' ')
    }
    $(`#line-${line}`).html(html)
    this.state.error = error
    this.state.height = height
    this.setState(this.state)
  }

  play () {
    let timer = setInterval(() => {
      if (this.state.error ||
          this.state.max <= this.state.step
      ) {
        clearInterval(timer)
        this.state.error = false
      } else {
        this.next()
      }
    }, 100)
  }

  nextHint () {
    this.state.reveal++
    this.setState(this.state)
    this.play()
    if (this.state.reveal > this.state.hints.length) {
      $('#show-next').hide()
    }
  }

  next () {
    if (this.state.max <= this.state.step) return
    this.state.step++
    this.update()
  }

  prev () {
    if (0 >= this.state.step) return
    this.state.step--
    this.update()
  }

  change () {
    if (this.state.id === 1) {
      this.state.id = 2
    } else {
      this.state.id = 1
    }
    this.setState(this.state)
    this.init()
  }

  render () {
    return <div>
      <div id="main" className="ui grid">
        <section id="container" className="nine wide column">
          <pre>
            <i id="tick" className="fa fa-arrow-right" style={{top: this.state.height}}></i>
            <PrismCode className="language-python" data-line="1">{this.state.code}</PrismCode>
            <div id="output">
              {this.state.step_a}
            </div>
            <div id="outer">
              <div id="error" className="ui left pointing red basic label">
                That name is taken!
              </div>
            </div>
          </pre>
          <br />
          <Slider
            dots
            min={1}
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

          <button className="ui button" onClick={this.change}>Change</button>
        </section>
        <section id="hint" className="seven wide column">
          {this.state.hints.map( (hint, index) => {
            if (index > this.state.reveal) return
            return (
              <div className="ui top attached segment">
                <div className="ui top attached label">
                  {hint.title}
                </div>
                <p>{hint.message}</p>
                <pre className="language-answer">
                  <code className="language-answer">
                    <p className="x">
                      <i className="fa fa-fw fa-times"></i>
                      {hint.x}
                    </p>
                    <p className="o">
                      <i className="fa fa-fw fa-check"></i>
                      {hint.o}
                    </p>
                  </code>
                </pre>
              </div>
            )
          })}
          <br />
          <button id="show-next" className="ui button" onClick={this.nextHint}>Show next hint</button>
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

