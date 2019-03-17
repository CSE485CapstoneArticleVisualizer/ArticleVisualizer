import React, { Component } from "react";
import * as d3 from "d3";
import "./Visualizer.css";
import ProgressBar from "./ProgressBar";
import { Modal, Header } from "semantic-ui-react";
import SearchBar from "./SearchBar";
import axios from "axios";
// Alex tried to add a command line command into this javascript file - alex bitch tits claims to be superior btw
class Visualizer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading_status: {
        done: false,
        progress: 0,
        error: false,
        error_message: ""
      }
    };
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate() {}

  getData = () => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener("progress", this.onProgress);
    xhr.addEventListener("load", this.onLoad);
    xhr.addEventListener("error", this.onError);
    xhr.addEventListener("abort", this.onError);

    xhr.open("GET", "data.csv");
    xhr.setRequestHeader("Content-Type", "text/html");
    xhr.send();
  };

  onLoad = evt => {
    const xhr = evt.srcElement;
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        const stratify = d3
          .stratify()
          .parentId(d => d.id.substring(0, d.id.lastIndexOf("|")));

        const root = stratify(d3.dsvFormat("_").parse(xhr.responseText)).sum(
          d => 1
        );

        this.setState(
          prevState => {
            const loading_status = Object.assign({}, prevState.loading_status, {
              done: true
            });
            return Object.assign({}, prevState, {
              loading_status: loading_status
            });
          },
          () => this.initializePack(root)
        );
      } else {
        this.setState(prevState => {
          const loading_status = Object.assign({}, prevState.loading_status, {
            error: true,
            error_message: `Error ${xhr.status}, check log statements.`
          });
          return Object.assign({}, prevState, {
            loading_status: loading_status
          });
        });
      }
    }
  };

  initializePack = root => {
    const getNonLeafNodes = node => {
      if (node.height === 1) {
        return node;
      } else {
        let non_leaf_nodes = new Array(node);
        if (node.children) {
          node.children.forEach(child => {
            non_leaf_nodes = non_leaf_nodes.concat(getNonLeafNodes(child));
          });
        }
        return non_leaf_nodes;
      }
    };

    const non_leaf_nodes = getNonLeafNodes(root);
    const subject_area_nodes = non_leaf_nodes.filter(node => node.depth === 2);

    let subject_area_nodes_children = {};

    subject_area_nodes.forEach(node => {
      subject_area_nodes_children[node.data.id] = node.children;
      node.children = null;
    });

    const pack = d3
      .pack()
      .size([window.innerWidth, window.innerHeight])
      .padding(3);

    pack(root);

    root.each(d => {
      d.data.name = d.data.id.substring(d.id.lastIndexOf("|") + 1);
    });

    subject_area_nodes.forEach(node => {
      node.children = subject_area_nodes_children[node.data.id];
    });

    this.drawMainPack(root, non_leaf_nodes, null);
  };

  drawMainPack = (root, nodes, prevTransformations) => {
    const svg = d3.select("svg#main_svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

    svg.selectAll("*").remove();

    const color = d3.scaleSequential(d3.interpolateMagma).domain([-4, 4]);

    const selection = svg
      .selectAll("g")
      .attr("id", "main")
      .data(nodes, d => d.data.id);

    selection.exit().remove();

    const node = selection
      .enter()
      .append("g")
      .attr("id", "main")
      .attr("transform", d => `translate(${d.x},${d.y})`);
    // .each(function(d) {d.node = this})

    const circle = node
      .append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => color(d.depth));

    const drawText = () => {
      const text_selection = svg.append("g").attr("id", "text");
      node.each(function(d) {
        const node_selection = d3.select(this);
        const radius = +node_selection.select("circle").attr("r");

        const ratio = (radius / window.innerHeight) * 100;

        if (10 <= ratio && ratio <= 50) {
          text_selection
            .append("g")
            .attr("transform", node_selection.attr("transform"))
            .append("text")
            .attr("text-anchor", "middle")
            .text(d.data.name);
        }
      });
    };

    const text = ["categories", "subject areas", "journals"];
    node
      .append("title")
      .text(
        node =>
          `${node.data.name}\nContains: ${
            node.children ? node.children.length : 0
          } ${text[node.depth]}`
      );

    const scaleX = d3
      .scaleLinear()
      .range([width / 2 - root.r, width / 2 + root.r]);
    const scaleY = d3
      .scaleLinear()
      .range([height / 2 - root.r, height / 2 + root.r]);

    let transformations = { x: 0, y: 0, k: 1 };

    const zoomed = transform => {
      const { x, y, k } = transform;
      transformations = Object.assign(transformations, transform);
      scaleX.domain([(root.x - root.r) / k, (root.x + root.r) / k]);
      scaleY.domain([(root.y - root.r) / k, (root.y + root.r) / k]);
      node.attr(
        "transform",
        d => `translate(${scaleX(d.x) + x}, ${scaleY(d.y) + y})`
      );
      circle.attr("r", d => d.r * k);
    };

    svg.call(
      d3
        .zoom()
        .on("zoom", () => zoomed(d3.event.transform))
        .scaleExtent([0.75, 25])
        .on("start", () => svg.selectAll("g#text").remove())
        .on("end", drawText)
    );

    if (prevTransformations) {
      zoomed(prevTransformations);
    }

    drawText();

    const subject_area_nodes_selection = svg
      .selectAll("g#main")
      .filter(d => d.depth === 2);
    subject_area_nodes_selection.on("click", node => {
      svg.on(".zoom", null);
      svg.selectAll("g#text").remove();
      const node_copy = node.copy();

      node_copy.each(d => {
        d.data.name = d.data.id.substring(d.data.id.lastIndexOf("|") + 1);
      });
      this.drawSubPack({ root, nodes }, node_copy, transformations);
    });
  };

  drawSubPack = ({ root, nodes }, sub_root, prevTransformations) => {
    const svg = d3.select("svg#main_svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

    const non_main_circle_selection = svg
      .selectAll("g#main")
      .filter(d => d.id !== root.data.id);
    const main_circle_selection = svg
      .selectAll("g#main")
      .filter(d => d.id === root.data.id);

    non_main_circle_selection.remove();
    main_circle_selection
      .transition()
      .duration(250)
      .attr("transform", `translate(50, ${window.innerHeight - 50})`)
      .select("circle")
      .attr("r", 0)
      .transition()
      .duration(150)
      .attr("r", 30);

    let transformations = { x: 0, y: 0, k: 1 };

    main_circle_selection.on("click", () => {
      svg.on(".zoom", null);
      this.drawMainPack(root, nodes, transformations);
    });

    svg.append("g").attr("id", "sub_pack");

    const pack = d3
      .pack()
      .size([window.innerWidth, window.innerHeight])
      .padding(3);

    sub_root.x = null;
    sub_root.y = null;
    sub_root.r = null;
    pack(sub_root);

    const color = d3.scaleSequential(d3.interpolateMagma).domain([-4, 4]);

    const selection = svg
      .select("g#sub_pack")
      .selectAll("g")
      .data([sub_root].concat(sub_root.children), d => d.data.id);

    selection.exit().remove();

    const node = selection
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    const circle = node
      .append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => color(d.depth));

    const text = ["journals", "social media articles"];
    node
      .append("title")
      .text(
        node =>
          `${node.data.name}\nContains: ${
            node.children ? node.children.length : 0
          } ${text[node.depth]}`
      );

    const scaleX = d3
      .scaleLinear()
      .range([width / 2 - root.r, width / 2 + root.r]);
    const scaleY = d3
      .scaleLinear()
      .range([height / 2 - root.r, height / 2 + root.r]);

    const zoomed = transform => {
      const { x, y, k } = transform;
      transformations = Object.assign(transformations, transform);
      scaleX.domain([(root.x - root.r) / k, (root.x + root.r) / k]);
      scaleY.domain([(root.y - root.r) / k, (root.y + root.r) / k]);
      node.attr(
        "transform",
        d => `translate(${scaleX(d.x) + x}, ${scaleY(d.y) + y})`
      );
      circle.attr("r", d => d.r * k);
    };

    if (prevTransformations) {
      zoomed(prevTransformations);
    }

    svg.call(
      d3
        .zoom()
        .on("zoom", () => zoomed(d3.event.transform))
        .scaleExtent([0.75, 25])
    );

    const leaf_nodes = svg
      .select("g#sub_pack")
      .selectAll("g")
      .filter(d => d.data.id !== sub_root.data.id);
    // console.log(leaf_nodes)
    leaf_nodes.on("click", () => console.log(1));
  };

  drawNetwork = () => {};

  onProgress = evt => {
    if (evt.lengthComputable) {
      const percentComplete = evt.loaded / evt.total;
      this.setState(prevState => {
        const loading_status = Object.assign({}, prevState.loading_status, {
          progress: percentComplete
        });
        return Object.assign({}, prevState, { loading_status: loading_status });
      });
    }
  };

  onError = evt => {
    console.log("Error occured: ", evt);
    this.setState(prevState => {
      const loading_status = Object.assign({}, prevState.loading_status, {
        error: true,
        error_message: "Error occured, check log statements."
      });
      return Object.assign({}, prevState, { loading_status: loading_status });
    });
  };

  onSubmit = async input => {
    console.log("Submitted: ", input);

    // console.log(await axios.get("http://localhost:3900/api/users/get_author"));
    axios
      .get("http://localhost:3900/api/users/get_author/?author=" + input)
      .then(function(response) {
        console.log(response);
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  render() {
    const { done, progress, error, error_message } = this.state.loading_status;
    if (error) {
      const error_instructions = "Please report bug to afreidoo@asu.edu.";
      return (
        <Modal trigger={null} open={error}>
          <Header icon="bug" content="Error" />
          <Modal.Content scrolling>
            {error_instructions}
            <br />
            {error_message}
          </Modal.Content>
        </Modal>
      );
    }

    if (done) {
      return (
        <div id="container">
          <svg
            id="main_svg"
            width={window.innerWidth}
            height={window.innerHeight}
          />
          <SearchBar onSubmit={this.onSubmit} />
        </div>
      );
    } else {
      return <ProgressBar percent={progress} />;
    }
  }
}

export default Visualizer;
