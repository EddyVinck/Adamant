const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");

const Mutations = {
  async createItem(parent, args, context, info) {
    // TODO: Check if they are logged in

    const item = await context.db.mutation.createItem(
      {
        data: { ...args }
      },
      info
    );
    return item;
  },

  async updateItem(parent, args, context, info) {
    // First take a copy of the updates
    const updates = { ...args };
    // Remove the id from the updates
    delete updates.id;
    // run the update method
    return context.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info // this is how the update function knows what to return to the client
    );
  },
  async deleteItem(parent, args, context, info) {
    const where = { id: args.id };

    // 1. find the item
    const item = await context.db.query.item(
      { where },
      /* This query is 'info' and requests that these fields come back.
      Sometimes you need a second intermediary query, so the info parameter cannot be used here. 
      We are going to manually pass a query here. Raw GraphQL */
      `
      {
        id
        title
      }
    `
    );
    // 2. Check if they own that item, or have the permissions
    // TODO

    // 3. Delete it!
    return context.db.mutation.deleteItem(
      {
        where
      },
      info
    );
  },
  async signup(parent, args, context, info) {
    args.email = args.email.toLowerCase();

    // Hash their password
    const password = await bcrypt.hash(args.password, 10);

    // Create the user in the database
    const user = await context.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] } // Because permissions is reaching out to an externam enum, you have to set it like this with an array with the default permissions
        }
      },
      info
    );
    // Create the JWT token for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the jwt as a cookie on the response
    context.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });

    // Finally, return the user to the browser
    return user;
  },
  async signin(parent, args, context, info) {
    const { email, password } = args;
    // 1. Check if there is a user with that email
    const user = await context.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. Check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid password");
    }
    // 3. Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // 4. Set the cookie with the token
    context.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    });
    // 5. Return the user
    return user;
  },
  signout(parent, args, context, info) {
    context.response.clearCookie("token"); // clearCookie method is provided by middleware
    return {
      message: "User successfully signed out!"
    };
  },
  async requestReset(parent, args, context, info) {
    // 1. Check if this is a real user
    const user = await context.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }

    // 2. Set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString("hex");
    const oneHour = 3600000;
    const resetTokenExpiry = Date.now() + oneHour;
    const res = await context.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    console.log(res);
    // 3. Email them that reset token

    return {
      message: "Requested reset link."
    };
  },
  async resetPassword(parent, args, context, info) {
    // 1. Check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error(`Incorrect password provided`);
    }

    // 2. Check if it is a legit reset token
    // 3. Check if it is expired
    const oneHour = 3600000;
    const [user] = await context.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - oneHour // _gte means greater then or equal to
      }
    });
    if (!user) {
      throw new Error(
        `The token is invalid or expired. Try requesting a new password reset link.`
      );
    }
    // 4. Hash their new password
    const password = await bcrypt.hash(args.password, 10);

    // 5. Save the new password to the user
    // 6. Remove old reset token fields
    const updatedUser = await context.db.mutation.updateUser({
      where: { email: user.email },
      data: { password, resetToken: null, resetTokenExpiry: null }
    });

    // 7. Generate JWT
    const token = jwt.sign(
      {
        userId: updatedUser.id
      },
      process.env.APP_SECRET
    );

    // 8. Set the JWT cookie
    context.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });

    // 9. Return the new user
    return updatedUser;
  }
};

module.exports = Mutations;
