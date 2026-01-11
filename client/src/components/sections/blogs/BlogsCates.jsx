import React from "react";
import { useGetAllCategoriesQuery } from "../../../redux/services/adminApi";
import { Link } from "react-router-dom";
import Spinner from "../../Spinner";

const BlogsCates = () => {
  const { data: categoriesData, isLoading } = useGetAllCategoriesQuery({
    type: "blog",
    isActive: true,
  });
  const categories = categoriesData || [];

  if (isLoading) {
    return (
      <div className="md:h-[50vh] w-full px-3 sm:px-4 md:px-6 lg:px-8 py-5">
        <div className="flex justify-center items-center h-64">
          <Spinner fullScreen={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="md:h-[50vh] w-full px-3 sm:px-4 md:px-6 lg:px-8 py-5">
      <div className="">
        <h2 className="text-2xl sm:text-3xl font-semibold">
          All Categories
          <span className="w-16 rounded-xl mb-2 ml-5 h-1 bg-gray-500 inline-block "></span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-14 mt-5">
          {categories.map((cate) => {
            return (
              <Link
                key={cate._id}
                to={`/blog?category=${cate._id}`}
                className="bg-[#D0D0D0] flex items-center flex-col p-5 rounded-xl hover:bg-[#C0C0C0] transition-colors group"
              >
                <div className="mb-4">
                  {cate.image ? (
                    <img
                      src={cate.image}
                      alt={cate.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-2xl text-gray-600">
                        {cate.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="text-2xl my-4 text-center group-hover:text-primary-600 transition-colors">
                  {cate.name}
                </h4>
                <p className="text-center text-gray-600 text-sm">
                  {cate.description || `Browse all ${cate.name} articles`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BlogsCates;
