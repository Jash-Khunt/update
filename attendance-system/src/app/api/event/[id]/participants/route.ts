import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Event from "@/models/event.model";
import SoloRegistration from "@/models/soloRegistration.model";
import GroupRegistration from "@/models/groupRegistration.model";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    let participants = [];

    if (event.eventType === "SOLO") {
      const pipeline = [
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(params.id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "userdetails",
            localField: "userId",
            foreignField: "userId",
            as: "userDetail",
            pipeline: [
              {
                $project: {
                  department: 1,
                  year: 1,
                  semester: 1,
                  phoneNumber: 1,
                  enrollmentNo: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            user: { $first: "$user" },
            userDetail: { $first: "$userDetail" },
          },
        },
        {
          $project: {
            _id: 0,
            userId: "$user._id",
            name: "$user.name",
            email: "$user.email",
            department: "$userDetail.department",
            year: "$userDetail.year",
            semester: "$userDetail.semester",
            phoneNumber: "$userDetail.phoneNumber",
            enrollmentNo: "$userDetail.enrollmentNo",
            registeredAt: "$createdAt",
          },
        },
        {
          $sort: { name: 1 },
        },
      ];

      participants = await SoloRegistration.aggregate(pipeline);
    } else {
      const pipeline = [
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(params.id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "userdetails",
            localField: "userId",
            foreignField: "userId",
            as: "userDetail",
            pipeline: [
              {
                $project: {
                  department: 1,
                  year: 1,
                  semester: 1,
                  phoneNumber: 1,
                  enrollmentNo: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            user: { $first: "$user" },
            userDetail: { $first: "$userDetail" },
          },
        },
        {
          $group: {
            _id: "$groupId",
            members: {
              $push: {
                userId: "$user._id",
                name: "$user.name",
                email: "$user.email",
                department: "$userDetail.department",
                year: "$userDetail.year",
                semester: "$userDetail.semester",
                phoneNumber: "$userDetail.phoneNumber",
                enrollmentNo: "$userDetail.enrollmentNo",
                registeredAt: "$createdAt",
              },
            },
          },
        },
        {
          $project: {
            groupId: "$_id",
            members: 1,
            _id: 0,
          },
        },
        {
          $sort: { "members.0.name": 1 },
        },
      ];

      participants = await GroupRegistration.aggregate(pipeline);
    }

    return NextResponse.json({
      success: true,
      event,
      participants,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}