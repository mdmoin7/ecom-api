import User from "../models/user.model.js";

class UserRepository {
  create(data) {
    return User.create(data);
  }
  findById(id) {
    return User.findOne({ userId: id });
  }
  findByEmail(email) {
    return User.findOne({ email: email });
  }
  update(id, data) {
    return User.findOneAndUpdate({ userId: id }, data, {
      new: true,
      runValidators: true,
    });
  }
  delete(id) {
    return User.findOneAndDelete({ userId: id });
  }
}

export default UserRepository;
