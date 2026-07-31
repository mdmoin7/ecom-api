import User from "../models/user.model.js";

class UserRepository {
  create(data: any) {
    return User.create(data);
  }
  findById(id: string) {
    return User.findOne({ userId: id });
  }
  findByEmail(email: string) {
    return User.findOne({ email: email });
  }
  update(id: string, data: any) {
    return User.findOneAndUpdate({ userId: id }, data, {
      new: true,
      runValidators: true,
    });
  }
  delete(id: string) {
    return User.findOneAndDelete({ userId: id });
  }
}

export default UserRepository;
