import React from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import CartStyles from "./styles/CartStyles";
import Supreme from "./styles/Supreme";
import CloseButton from "./styles/CloseButton";
import SickButton from "./styles/SickButton";

const LOCAL_STATE_QUERY = gql`
  query LOCAL_STATE_QUERY {
    cartOpen @client # the @client directive tells Apollo to fetch this data from the client's Apollo store
  }
`;

const TOGGLE_CART_MUTATION = gql`
  mutation TOGGLE_CART_MUTATION {
    toggleCart @client
  }
`;

const Cart = props => {
  return (
    <Mutation mutation={TOGGLE_CART_MUTATION}>
      {toggleCart => {
        return (
          <Query query={LOCAL_STATE_QUERY}>
            {({ data }) => {
              return (
                <CartStyles open={data.cartOpen}>
                  <header>
                    <CloseButton onClick={toggleCart} title="close">
                      &times;
                    </CloseButton>
                    <Supreme>Your Cart</Supreme>
                    <p>You have __ items in your cart.</p>
                  </header>
                  <footer>
                    <p>$11.11</p>
                    <SickButton>Checkout</SickButton>
                  </footer>
                </CartStyles>
              );
            }}
          </Query>
        );
      }}
    </Mutation>
  );
};

export default Cart;
export { LOCAL_STATE_QUERY, TOGGLE_CART_MUTATION };
