import React, { Component } from "react";
import { Input } from "semantic-ui-react";

class SearchBar extends Component {
  state = {
    input: ""
  };

  onChange = evt => {
    this.setState({ input: evt.currentTarget.value });
  };

  render() {
    return (
      <div id="input">
        <Input
          action={{
            icon: { name: "search", circular: true, link: true },
            onClick: () => this.props.onSubmit(this.state.input)
          }}
          placeholder="alex is a bitch"
          onChange={this.onChange}
        />
      </div>
    );
  }
}

export default SearchBar;
