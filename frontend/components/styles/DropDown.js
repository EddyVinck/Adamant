import styled, { keyframes } from "styled-components";

const DropDown = styled.div`
  position: absolute;
  width: 100%;
  z-index: 2;
  border: 1px solid ${props => props.theme.lightgrey};
  line-height: 1;
`;

const DropDownItem = styled.div`
  font-size: 1rem;
  border-bottom: 1px solid ${props => props.theme.lightgrey};
  background: ${props => (props.highlighted ? "#f7f7f7" : "white")};
  padding: 1rem;
  transition: all 0.2s;
  ${props => (props.highlighted ? "padding-left: 2rem;" : null)};
  display: flex;
  align-items: center;
  border-left: 10px solid
    ${props => (props.highlighted ? props.theme.lightgrey : "white")};
  img {
    margin-right: 10px;
  }
`;

const glow = keyframes`
  from {
    box-shadow: 0 0 0px yellow;
  }

  to {
    box-shadow: 0 0 10px 1px yellow;
  }
`;

const SearchStyles = styled.div`
  padding: 1rem 1rem;

  position: relative;
  line-height: 1;
  display: flex;
  align-items: center;
  input {
    width: 10rem;
    padding: 10px;
    border: 0;
    font-size: 1.2rem;
    transition: 0.16s;
    &.loading {
      animation: ${glow} 0.5s ease-in-out infinite alternate;
    }

    &:active,
    &:focus {
      width: 24rem;
    }

    @media (min-width: ${props => props.theme.breakpoints.medium}) {
      padding: 1rem 3rem;
      width: 17.5rem;
    }
  }
`;

export { DropDown, DropDownItem, SearchStyles };
