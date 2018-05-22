import React, {PropTypes} from 'react';
import '../style/select.less';

function noop() {}

class Select extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      value: props.value || '',
      data: props.data,
      label: props.data[0] && props.data[0].name,
      disabled: props.disabled || !props.data.length
    };

    ['onChange'].forEach((func) => {
      this[func] = this[func].bind(this);
    });
  }

  componentWillReceiveProps(nextProps) {
    let label = nextProps.value && this.state.data.filter(i => {
      return i.id === nextProps.value;
    })[0];
    if (!label) {
      label = nextProps.data && nextProps.data.length && nextProps.data[0];
    }
    if (label) {
      this.setState({
        value: nextProps.value || '',
        data: nextProps.data,
        disabled: nextProps.disabled || !nextProps.data.length
      });
    } else {
      this.setState({
        value: nextProps.value || '',
        data: nextProps.data,
        disabled: nextProps.disabled || !nextProps.data.length,
        label: label.name
      });
    }
  }

  onChange(e) {
    let value = e.target.value;
    let label = this.state.data.filter(i => {
      return i.id === value;
    })[0];
    this.props.onAction && this.props.onAction('table', this.props.type, {
      value: e.target.value,
      position: this.props.position,
      label: label.name
    });
    this.setState({
      value: value
    });
  }

  onBlur(e) {}

  render() {
    let props = this.props;
    let state = this.state;
    return (
      <div ref="select" >
        <select title={state.label ? state.label : ''} value={state.value} id={props.key} style={props.style} onChange={this.onChange} disabled={state.disabled} onBlur={this.onBlur.bind(this)}>
          {state.data.map(item => <option key={Math.random() + ''} style={{width: props.style.width}} value={item.id}>{item.name}</option>)}
        </select>
      </div>
    );
  }

}

Select.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func
};

Select.defaultProps = {
  value: '',
  data: [],
  disabled: false,
  onChange: noop
};

export default Select;
