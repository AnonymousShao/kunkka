import React, {PropTypes} from 'react';
import '../style/input.less';
// import styles from '../../mixins/styles';

function noop() {}

class Input extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      value: props.value || ''
    };

    ['onChange'].forEach((func) => {
      this[func] = this[func].bind(this);
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: nextProps.value
    });
  }

  onChange(e) {
    let value = e.target.value;
    this.props.onAction && this.props.onAction('table', this.props.type, {
      value: e.target.value,
      position: this.props.position
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
      <input style={props.style}
        disabled={props.disabled ? 'disabled' : null}
        onChange={this.onChange}
        title={state.value}
        value={state.value} />
    );
  }

}

Input.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func
};

Input.defaultProps = {
  value: '',
  disabled: false,
  onChange: noop
};

export default Input;
