import React from "react";
import * as API from "../../../api/api.js";
import APISelectList, { LIST_OF_MAJORS } from "components/APISelectList.js";

class StudentMajors extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
          majors: []
        }

        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
      this.update();
  }

    render() {
      const { majors } = this.state;
        return (
          <div>
              <select>
              {majors.map((major, index) => (
                <option key={index} value={major.MajorName}>
                  {major.MajorName}
                </option>
              ))}
              </select>
          </div>
        )
    }

    handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        this.setState({
            [name]: value
        });
    }

    update() {
      APISelectList.getListOfType(LIST_OF_MAJORS).then(majors => {
          this.setState({majors: majors});
      });
    }
}

export default StudentMajors;