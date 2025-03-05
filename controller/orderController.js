import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "../db.config.js";
import { contacts } from "../schema.js";

export const orderController = async (req, res) => {
  let { phoneNumber, email } = req.body;

  // Trim and handle empty values
  phoneNumber = phoneNumber?.trim() || null;
  email = email?.trim() || null;

  if (!email && !phoneNumber) {
    return res.status(400).json({ status: false, message: "Provide at least email or phoneNumber." });
  }

  try {
    // Fetch users matching email or phoneNumber
    let existingUsers = await db
      .select()
      .from(contacts)
      .where(or(eq(contacts.email, email), eq(contacts.phoneNumber, phoneNumber)));

    console.log({ existingUsers });

    if (existingUsers.length) {
      // Identify primary users
      let primaryUsers = existingUsers.filter((e) => e.linkPrecedence === "primary");

      if (primaryUsers.length === 0) {
        // If all are secondary, fetch their primary user
        primaryUsers = await db
          .select()
          .from(contacts)
          .where(
            inArray(
              contacts.id,
              existingUsers.map((e) => e.linkedId)
            )
          );
      }

      let primaryUser = primaryUsers.reduce((minUser, user) => (user.id < minUser.id ? user : minUser), primaryUsers[0]);

      const allSecondaryUsers = await db.select().from(contacts).where(eq(contacts.linkedId, primaryUser.id));

      const secondaryUsersToUpdate = primaryUsers.filter((user) => user.id !== primaryUser.id);

      if (secondaryUsersToUpdate.length > 0) {
        await db
          .update(contacts)
          .set({ linkedId: primaryUser.id, linkPrecedence: "secondary" })
          .where(
            inArray(
              contacts.id,
              secondaryUsersToUpdate.map((user) => user.id)
            )
          );

        const allLinkedContacts = await db
          .select()
          .from(contacts)
          .where(or(eq(contacts.id, primaryUser.id), eq(contacts.linkedId, primaryUser.id)));

        return res.status(200).json({
        //   status: false,
        //   message: "Provide at least email or phoneNumber.",
          contact: {
            primaryContactId: primaryUser.id,
            emails: Array.from(new Set(allLinkedContacts.map((e) => e.email).filter(Boolean))),
            phoneNumbers: Array.from(new Set(allLinkedContacts.map((e) => e.phoneNumber).filter(Boolean))),
            secondaryContactIds: allLinkedContacts.filter((e) => e.id !== primaryUser.id).map((e) => e.id),
          },
        });
      }


      if (existingUsers.some((e) => e.email === email && e.phoneNumber === phoneNumber)) {
        return res.status(200).json({
        //   status: true,
        //   message: "User already exists",
          contact: {
            primaryContactId: primaryUser.id,
            emails: Array.from(new Set([primaryUser.email, ...allSecondaryUsers.map((e) => e.email)].filter(Boolean))),
            phoneNumbers: Array.from(new Set([primaryUser.phoneNumber, ...allSecondaryUsers.map((e) => e.phoneNumber)].filter(Boolean))),
            secondaryContactIds: allSecondaryUsers.map((e) => e.id),
          },
        });
      }

      const isAlreadyExisting = allSecondaryUsers?.some((e) => e.email === email || e.phoneNumber === phoneNumber);
      if (isAlreadyExisting) {
        return res.status(200).json({
        //   status: true,
        //   message: "User already exists",
          contact: {
            primaryContactId: primaryUser.id,
            emails: Array.from(new Set([primaryUser.email, ...allSecondaryUsers.map((e) => e.email)].filter(Boolean))),
            phoneNumbers: Array.from(new Set([primaryUser.phoneNumber, ...allSecondaryUsers.map((e) => e.phoneNumber)].filter(Boolean))),
            secondaryContactIds: allSecondaryUsers.map((e) => e.id),
          },
        });
      }

      // If one of the provided values exists, link as a secondary user
      const newSecondary = await db
        .insert(contacts)
        .values({
          phoneNumber,
          email,
          linkedId: primaryUser.id,
          linkPrecedence: "secondary",
        })
        .returning();

      allSecondaryUsers.push(newSecondary[0]);

      return res.status(201).json({
        // status: true,
        // message: "User exists, used different credential",
        contact: {
          primaryContactId: primaryUser.id,
          emails: Array.from(new Set([primaryUser.email, ...allSecondaryUsers.map((e) => e.email)].filter(Boolean))),
          phoneNumbers: Array.from(new Set([primaryUser.phoneNumber, ...allSecondaryUsers.map((e) => e.phoneNumber)].filter(Boolean))),
          secondaryContactIds: allSecondaryUsers.map((e) => e.id),
        },
      });
    }

    // If both email and phoneNumber are new, create a new primary contact
    if (email && phoneNumber) {
      const newUser = await db
        .insert(contacts)
        .values({
          phoneNumber,
          email,
          linkPrecedence: "primary",
        })
        .returning();

      return res.status(201).json({
        // status: true,
        // message: "New User Created",
        contact: {
          primaryContactId: newUser[0]?.id,
          emails: newUser[0]?.email ? [newUser[0]?.email] : [],
          phoneNumbers: newUser[0]?.phoneNumber ? [newUser[0]?.phoneNumber] : [],
          secondaryContactIds: [],
        },
      });
    }

    return res.status(400).json({ status: false, message: "Invalid request." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
