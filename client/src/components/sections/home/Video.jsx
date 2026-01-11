import React from "react";
import { FaCheck } from "react-icons/fa6";
import { images } from "../../../assets/assets";

const Video = () => {
  return (
    <div className="bg-gray-100 w-full py-8 md:py-16">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 mx-auto flex flex-col sm:flex-col md:flex-col lg:flex-row gap-10">
        <div className="video lg:w-1/2 md:w-full border-2 border-primary/70 rounded overflow-hidden">
          <video
            src={images.selloVido}
            muted
            loop
            className="w-full h-auto object-cover rounded"
            autoPlay
            playsInline
          ></video>
        </div>
        <div className="content">
          <h2 className="md:text-5xl text-3xl font-semibold max-w-4xl pb-5">
            A Smarter Way to Sell Your Car in Pakistan
          </h2>
          <p className="py-4 text-gray-600">
            In Pakistan if you are looking to put your car for sale or reach out
            to the buyers that are actively in the market for a used car, we
            connect you with true buying prospects from across the nation. We
            have designed our platform to get a fair price for your car quickly
            and in a transparent way.
          </p>
          <ul>
            {[
              "Post your car for sale in Karachi, Islamabad, Lahore and outlying areas.",
              "Reach out to a large audience of car buyers which includes both new and used cars for sale in Pakistan.",
              "Get quick inspections at great prices and also have transparent and reliable valuations.",
            ].map((list, index) => (
              <li key={index} className="flex items-center gap-2 my-2">
                {" "}
                <FaCheck className="md:w-7 w-5 md:h-7 h-5 rounded-full bg-white text-green-400 p-1 shadow-md " />{" "}
                {list}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Video;
