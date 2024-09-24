import { NextFunction, Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import orderRabbitMQClient from "./rabbitMQ/client";
import courseRabbitMQClient from "../course/rabbitMQ/client";
import "dotenv/config";
import { StatusCode } from "../../interface/enum";
import userRabbitMQClient from "../user/rabbitMQ/client";


interface RevenueData {
  createdAt: string | number | Date;
  totalInstructorRevenue: number;
  totalAdminRevenue: number;
  courseId: string;
}

interface CourseDetails {
  _id: any;
  courseId: string;
  name: string;
}

export default class orderController {
  sendPublishKey = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "stripe-publishkey";
      const response: any = await orderRabbitMQClient.produce(null, operation);

      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      next(e);
    }
  };

  newPayment = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const amount = req.body.amount;
      const operation = "payment-intent";
      const response: any = await orderRabbitMQClient.produce(
        amount,
        operation
      );
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      next(e);
    }
  };

  createOrder = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { courseId, payment_info } = req.body;
      const userId = req?.userId;

      const userResponse: any = await userRabbitMQClient.produce(
        { id: userId },
        "get-user"
      );
      const result = JSON.parse(userResponse.content.toString());
      console.log("Result", result);

      if (!result) {
        res
          .status(StatusCode.NotFound)
          .json({ success: false, message: "User not found" });
        return;
      }

      const courseExistInUser = result?.courses?.some(
        (id: any) => id === courseId
      );
      if (courseExistInUser) {
        res
          .status(StatusCode.Conflict)
          .json({ success: false, message: "already purchased course" });
        return;
      }

      const data = {
        courseId,
        payment_info,
        userId,
      };
      const operation = "create-order";
      const response: any = await orderRabbitMQClient.produce(data, operation);
      const updateCourseResponse: any = await userRabbitMQClient.produce(
        { userId, courseId },
        "update-course-list"
      );
      const resultUpdateCourse = JSON.parse(
        updateCourseResponse.content.toString()
      );
      // if (!resultUpdateCourse.success) {
      //   res
      //     .status(StatusCode.BadGateway)
      //     .json({ success: false, message: "Bad Gateway" });
      //   return;
      // }
      const courseResponse: any = await courseRabbitMQClient.produce(
        courseId,
        "update-purchase-count"
      );
      const resultCourse = JSON.parse(courseResponse.content.toString());
      res.status(StatusCode.Created).json(resultCourse);
    } catch (e: any) {
      next(e);
}
};

getOrderAnalytics = async(req:CustomRequest,res:Response,next:NextFunction)=>{
  try {
    const instructorId = req.params.id;
    const operation = "order-analytics";
    const response:any = await orderRabbitMQClient.produce(instructorId,operation);
    // const result = JSON.parse(response.content.toString());
    res.status(StatusCode.Ok).json(response);
  } catch (e:any) {
    next(e)
  }
}

getRevenueAnalytics = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const instructorId = req.params.id;
    console.log("instructorId",instructorId)
    const operation = "revenue-analytics";

    
    const response: any = await orderRabbitMQClient.produce(instructorId, operation);

    console.log("response",response);

    
    const courseIds: string[] = response.map((item: RevenueData) => item.courseId);

    console.log("Course IDs:", courseIds);

    
    const courseDetailsPromises = courseIds.map((courseId: string) =>
      courseRabbitMQClient.produce(courseId, "get-course-content") 
    );

    
    const courseDetailsResponses: any[] = await Promise.all(courseDetailsPromises);

    // Map courseId to course name
    const courseIdToName: Record<string, string> = {};
    courseDetailsResponses.forEach((courseResponse: any) => {
      const courseDetails: CourseDetails = JSON.parse(courseResponse.content.toString());

      console.log("courseDetails",courseDetails);

      

      if (courseDetails._id && courseDetails.name) {
        courseIdToName[courseDetails._id] = courseDetails.name;
      } else {
        console.log(`Missing courseId or courseName in response:`, courseDetails);
      }
    });

    console.log("Course ID to Name Mapping:", courseIdToName); // Log mapping

    
    const enrichedResponse = response.map((item: RevenueData) => ({
      ...item,
      courseName: courseIdToName[item.courseId] || "Unknown Course"
    }));

    // Sort the response based on the order creation or update timestamp
    const sortedResponse = enrichedResponse.sort((a: RevenueData, b: RevenueData) => {
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.status(StatusCode.Ok).json(sortedResponse);
  } catch (e: any) {
    next(e);
  }
}

getInstructorRevenueAnalytics = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const instructorId = req.params.id;

    
    const userResponse: any = await userRabbitMQClient.produce(
      { id: instructorId },
      "get-user"
    );

    const userDetails = JSON.parse(userResponse.content.toString());

    if (!userDetails || !userDetails.courses) {
      return res.status(StatusCode.NotFound).json({
        success: false,
        message: "Instructor or courses not found"
      });
    }
    const courseIds: string[] = userDetails.courses.map((course: { courseId: string }) => course.courseId);

    console.log("courseIds",courseIds)

    const revenueAnalyticsPromises = courseIds.map((courseId: string) =>
      orderRabbitMQClient.produce({ courseId }, "instructor-revenue-analytics")
    );

    console.log("revenueAnalyticsPromises",revenueAnalyticsPromises)

    const revenueAnalyticsResponses = await Promise.all(revenueAnalyticsPromises);

    console.log("revenueAnalyticsResponses",revenueAnalyticsResponses)

   
    const courseIdToRevenue: Record<string, RevenueData> = {};
    revenueAnalyticsResponses.forEach((response: any) => {
      if (response && response.courseId) {
        try {
          console.log("Processing revenue response:", response);
          
          // Populate courseIdToRevenue
          courseIdToRevenue[response.courseId] = response;
        } catch (error) {
          console.error("Failed to process revenue data:", error);
        }
      } else {
        console.error("Invalid or missing courseId in response:", response);
      }
    });

    console.log("courseIdToRevenue",courseIdToRevenue)

    // Fetch course details for each course ID
    const courseDetailsPromises = courseIds.map((courseId: string) =>
      courseRabbitMQClient.produce(courseId, "get-course-content")
    );

    const courseDetailsResponses = await Promise.all(courseDetailsPromises);

    // Map courseId to course name
    const courseIdToName: Record<string, string> = {};
    courseDetailsResponses.forEach((courseResponse: any) => {
     
          const courseDetails: CourseDetails = JSON.parse(courseResponse.content.toString());
          if (courseDetails && courseDetails._id && courseDetails.name) {
            courseIdToName[courseDetails._id] = courseDetails.name;
          } else {
            console.log(`Missing courseId or courseName in response:`, courseDetails);
          }
      
    });

    console.log("Course ID to Name Mapping:", courseIdToName); // Log mapping

    // Combine revenue and course name details in the final response
    const finalResponse = courseIds.map((courseId: string) => ({
      courseName: courseIdToName[courseId] || "Unknown Course",
      totalInstructorRevenue: courseIdToRevenue[courseId]?.totalInstructorRevenue || 0,
    }));

    // Return the filtered response with only courseName and totalInstructorRevenue
    res.status(StatusCode.Ok).json(finalResponse);
  } catch (e: any) {
    next(e);
  }
};

}