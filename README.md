# ash-html

This is an extremely simple set of utility functions in vanilla JavaScript to make building a webpage from JavaScript code more similar to widget-based frameworks like Flutter. 

## Import into your website

In `index.html`:

`<script src="https://ash.magiwanders.com/ash-html.js"></script>`

#TODO Alternatively, npm package.

## Basic Usage

```javascript
_<type>({<attributes>}, <children>)
```

Where:
 - ```_<type>``` is the name of the HTML element with a prefix underscore (```_div``` for ```<div>```, ```_br``` for ```<br>``` and so on)
 - ```{<attributes>}``` is a JSON-like set of attributes (example: ```{id: 'thiselement', style:'height:100%; width:40px;'}``` )
 - ```<children>``` is either a simple ```string```, an element described with this same function fromat or an array of such elements.
     - Examples of valid ```<children>``` inputs:
         - Single string: ```'String that contains innerHTML'```
         - Single function: ``` _button({id: 'thisbutton'}, 'ButtonName') ```
         - Array of strings and functions:
         ```javascript
         [
          _button({id: 'thisbutton'}, 'ButtonName'),
          'another string',
          _button({id: 'thisotherbutton'}, 'OtherButtonName')
         ]
         ```
 
In case the type you want to use is not supported add it to the file and pull request (see the [Contributions](#contributions) section) or use the basic function:

```javascript
_Object('type', {<attributes>}, <children>)
```
Where ```'type'``` is just the name of the type with no capital letters.

## Example

To add the HTML code:

```html
<div id='simulation_controls' style='height:500px; width:100%; pointer-events:painted;'>
  <button id="toggle_simulation" style='background-color: green'>Pause</button> or 
  <button id="step">Step</button> the simulation.
  <br><br>
</div>
```

To the element:

```html
<div id='container'></div>
```

We can use the JavaScript code :

```javascript
document.getElementById('container').appendChild(
  _div({
    id: 'simulation_controls', 
    style: _css({
      height: '500px', 
      width: '100%',
      'pointer-events':'painted'
    })},
    [
        _button({id: 'toggle_simulation', style: _css({'background-color': 'green'})}, 'Pause'), 'or',
        _button({id: 'step'}, 'Step'), ' the simulation.',
        _br(), _br()
    ]
  )
)
```

## Contributions

To add support for example to the HTML element ```option``` add the string ```'option'``` to the ```HTMLTagList``` constant, and instead of:

```javascript
_Object('option', {<attributes>}, <children>)
```

You can now use:

```javascript
_option({<attributes>}, <children>)
```
